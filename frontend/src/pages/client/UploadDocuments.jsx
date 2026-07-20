import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import {
  Upload, X, Loader2, FileText, Receipt, ChevronDown, ChevronRight, Shield
} from 'lucide-react'
import safeToast from '../../utils/toast'

/* ======================================================================
   EXTERNAL LIBRARIES — loaded dynamically, once, on mount.
   ====================================================================== */
const CDN = {
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function loadExtractionLibs() {
  await Promise.all([loadScript(CDN.pdfjs), loadScript(CDN.xlsx)])
  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker
  }
}

// ============ FEE SCHEDULE ============
const FEE_SCHEDULE = {
  base: { label: 'Basic ITR fee (Salary / House Property / Other Sources)', amount: 500 },
  hpExtra: { label: 'Each house property beyond 2', amount: 100 },
  cgImmovable: { label: 'Capital Gains — immovable property', amount: 200 },
  cgEquity: { label: 'Capital Gains — equity / debt securities & mutual funds', amount: 300 },
  cgOther: { label: 'Capital Gains — other, incl. F&O', amount: 300 },
  bizPresumptive: { label: 'Business income — without accounts / financials', amount: 500 },
  bizAccounts: { label: 'Business income — with accounts & financials', amount: 700 },
  nri: { label: 'Non-Resident Indian', amount: 500 },
  residentForeign: { label: 'Resident with foreign income (DTAA / FTC / Form 67)', amount: 750 }
}

// ============ BILL AS MAPPING ============
const BILL_AS = {
  ignore: { label: '— Ignore this file —' },
  salary: { label: 'Salary (in base fee)', base: true },
  houseProperty: { label: 'House Property (in base fee)', base: true },
  ifos: { label: 'Other Sources (in base fee)', base: true },
  cgEquity: { label: 'Capital Gains — equity/debt/MF', component: 'cgEquity' },
  cgImmovable: { label: 'Capital Gains — immovable', component: 'cgImmovable' },
  cgOther: { label: 'Capital Gains — other / F&O', component: 'cgOther' },
  bizPresumptive: { label: 'Business — without financials', component: 'bizPresumptive' },
  bizAccounts: { label: 'Business — with financials', component: 'bizAccounts' }
}

const MISSED_OPTIONS = ['cgImmovable', 'cgEquity', 'cgOther', 'bizPresumptive', 'bizAccounts']

// ============ DOCUMENT DEFINITIONS ============
const DOCUMENT_DEFINITIONS = [
  {
    id: 'form16', label: 'Form 16 — Salary TDS certificate', billAs: 'salary',
    required: [['form no. 16', 'form no.16', 'form 16', 'form-16', 'certificate under section 203']],
    supporting: [
      ['traces'],
      ['tan of the deductor', 'tan of deductor'],
      ['gross salary', 'income chargeable under the head', 'salaries'],
      ['pan of the employee', 'pan of employee', 'employee reference'],
      ['quarter', 'period with the employer', 'assessment year']
    ],
    minSupporting: 2,
    note: 'Salary is included in the base fee.'
  },
  {
    id: 'interestCert', label: 'Bank / FD interest certificate', billAs: 'ifos',
    required: [['interest certificate', 'interest income', 'interest earned', 'interest on fixed deposit', 'term deposit', 'interest on deposits']],
    supporting: [
      ['fixed deposit', 'term deposit', 'recurring deposit', 'savings account'],
      ['interest credited', 'interest paid', 'interest accrued'],
      ['tds', 'tax deducted at source'],
      ['customer id', 'account number', 'ifsc', 'branch'],
      ['financial year', 'assessment year']
    ],
    minSupporting: 1,
    note: 'Interest income — included in the base fee.'
  },
  {
    id: 'homeLoan', label: 'Home-loan interest certificate', billAs: 'houseProperty',
    required: [['home loan', 'housing loan', 'loan account number', 'provisional certificate']],
    supporting: [
      ['interest', 'interest amount'],
      ['principal', 'principal repaid', 'principal amount'],
      ['provisional', 'final certificate'],
      ['section 24', 'section 80c'],
      ['property', 'property address', 'emi', 'tenure']
    ],
    minSupporting: 2,
    note: 'House Property — included in base fee. Set the number of properties on the left.'
  },
  {
    id: 'brokerCG', label: 'Broker capital-gains / Tax P&L statement', billAs: 'cgEquity',
    required: [['capital gains statement', 'capital gain statement', 'tax p&l', 'tax pnl', 'realised p&l', 'realized p&l', 'short term capital gain', 'long term capital gain']],
    supporting: [
      ['short term', 'long term', 'stcg', 'ltcg'],
      ['equity', 'shares', 'stocks', 'securities'],
      ['mutual fund', 'mutual funds', 'units'],
      ['zerodha', 'groww', 'upstox', 'angel one', 'icici direct', 'icicidirect', 'hdfc securities', 'kotak securities', '5paisa', 'dhan', 'paytm money'],
      ['buy value', 'sell value', 'purchase value', 'sale value', 'cost of acquisition'],
      ['isin', 'scrip', 'symbol', 'tradingsymbol']
    ],
    minSupporting: 2,
    note: 'Capital Gains (equity/debt/MF) — adds ₹300.'
  },
  {
    id: 'mfCG', label: 'Mutual fund capital-gains statement (CAMS/KFintech)', billAs: 'cgEquity',
    required: [['capital gains statement', 'capital gain statement', 'statement of capital gains']],
    supporting: [
      ['cams', 'kfintech', 'karvy', 'camsonline', 'mfcentral'],
      ['folio', 'folio number'],
      ['amc', 'scheme', 'plan'],
      ['redemption', 'purchase', 'switch', 'nav'],
      ['short term', 'long term', 'grandfathered']
    ],
    minSupporting: 2,
    note: 'Capital Gains (mutual funds) — adds ₹300.'
  },
  {
    id: 'fno', label: 'F&O / derivatives statement', billAs: 'cgOther',
    required: [['f&o', 'futures and options', 'derivatives', 'fno']],
    supporting: [
      ['turnover'],
      ['futures', 'options'],
      ['mtm', 'mark to market'],
      ['strike', 'expiry', 'lot size'],
      ['zerodha', 'groww', 'upstox', 'icici direct', 'dhan', 'angel one'],
      ['realised', 'realized']
    ],
    minSupporting: 2,
    note: "Treated as 'other capital gain (incl. F&O)' — adds ₹300."
  },
  {
    id: 'financials', label: 'Financial statements (P&L / Balance Sheet)', billAs: 'bizAccounts',
    required: [['balance sheet', 'statement of profit and loss', 'profit and loss account']],
    supporting: [
      ['capital account', 'proprietor', 'partners capital', "partner's capital"],
      ['sundry debtors', 'sundry creditors'],
      ['current assets', 'current liabilities', 'fixed assets'],
      ['depreciation'],
      ['trading account', 'gross profit', 'net profit'],
      ['as at', 'for the year ended']
    ],
    minSupporting: 2,
    note: 'Business income with accounts & financials — adds ₹700.'
  },
  {
    id: 'comprehensive', label: 'AIS / TIS / Form 26AS', billAs: 'ignore', special: 'review',
    required: [['annual information statement', 'taxpayer information summary', 'form 26as', 'annual tax statement']],
    supporting: [
      ['sft', 'specified financial transaction'],
      ['tds', 'tcs'],
      ['information category'],
      ['permanent account number'],
      ['assessment year']
    ],
    minSupporting: 1,
    note: 'This single document covers many income heads at once. Review the streams it lists and tick them manually.'
  }
]

const SETTINGS = { minTextChars: 20 }

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
const norm = (t) => (' ' + t + ' ').toLowerCase().replace(/\s+/g, ' ')
const groupHit = (text, group) => group.some(p => text.includes(p))

function classify(text) {
  const scored = DOCUMENT_DEFINITIONS.map(def => {
    const reqGroupResults = def.required.map(g => ({ group: g, hit: g.find(p => text.includes(p)) || null }))
    const reqOk = reqGroupResults.every(r => r.hit)
    const supGroupResults = (def.supporting || []).map(g => ({ group: g, hit: g.find(p => text.includes(p)) || null }))
    const supHits = supGroupResults.filter(r => r.hit)

    const evidence = []
    reqGroupResults.forEach(r => { if (r.hit) evidence.push(r.hit) })
    supGroupResults.forEach(r => { if (r.hit) evidence.push(r.hit) })

    const ok = reqOk && supHits.length >= (def.minSupporting || 0)
    const score = (reqOk ? def.required.length * 2 : 0) + supHits.length

    return {
      def, ok, score, supCount: supHits.length,
      evidence: [...new Set(evidence)].slice(0, 6),
      missingRequired: reqGroupResults.filter(r => !r.hit).map(r => r.group[0]),
      minSupporting: def.minSupporting || 0
    }
  })

  const okMatches = scored.filter(s => s.ok).sort((a, b) => b.score - a.score)
  const nearMisses = [...scored].sort((a, b) => b.score - a.score).slice(0, 3).map(s => ({
    label: s.def.label,
    reqMet: s.missingRequired.length === 0,
    missingRequired: s.missingRequired,
    supHave: s.supCount,
    supNeed: s.minSupporting
  }))

  if (!okMatches.length) return {
    status: 'unrecognized',
    nearMisses,
    billAs: 'ignore'
  }

  const best = okMatches[0]
  const confidence = best.supCount >= best.def.minSupporting + 1 ? 'high' : 'medium'

  return {
    status: best.def.special === 'review' ? 'comprehensive' : 'recognized',
    def: best.def,
    evidence: best.evidence,
    confidence,
    nearMisses,
    billAs: best.def.billAs || 'ignore'
  }
}

function reconstructPageText(items) {
  const Y_TOLERANCE = 3
  const rows = []
  items.forEach(it => {
    const x = it.transform[4]
    const y = it.transform[5]
    let row = rows.find(r => Math.abs(r.y - y) <= Y_TOLERANCE)
    if (!row) { row = { y, cells: [] }; rows.push(row) }
    row.cells.push({ x, str: it.str })
  })
  rows.sort((a, b) => b.y - a.y)
  rows.forEach(r => r.cells.sort((a, b) => a.x - b.x))
  return rows.map(r => r.cells.map(c => c.str).join(' ')).join('\n')
}

async function extractPdf(file, password) {
  if (!window.pdfjsLib) {
    throw { code: 'lib_missing', message: 'PDF reader library not loaded yet. Please retry in a moment.' }
  }
  const buf = await file.arrayBuffer()
  let pdf
  try {
    pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf), password }).promise
  } catch (e) {
    if (e && e.name === 'PasswordException') throw { code: 'password' }
    throw { code: 'pdf_error', message: (e && e.message) || 'Could not parse PDF.' }
  }
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    text += reconstructPageText(tc.items) + '\n'
  }
  return text
}

async function extractExcel(file) {
  if (!window.XLSX) {
    throw { code: 'lib_missing', message: 'Excel reader library not loaded yet. Please retry in a moment.' }
  }
  const buf = await file.arrayBuffer()
  const wb = window.XLSX.read(new Uint8Array(buf), { type: 'array' })
  return wb.SheetNames.map(n => window.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')
}

// ⭐ SINGLE SOURCE OF TRUTH: Classification happens ONCE here
async function processFile(rec, file, password) {
  rec.status = 'processing'
  try {
    let text = ''
    if (rec.ext === 'pdf') text = await extractPdf(file, password)
    else text = await extractExcel(file)

    rec.rawTextLength = text ? text.replace(/\s+/g, '').length : 0
    rec.rawTextPreview = text ? text.trim().slice(0, 500) : ''

    if (!text || rec.rawTextLength < SETTINGS.minTextChars) {
      rec.status = 'scanned'
      rec.detected = null
      rec.bill_as = 'ignore'
    } else {
      const result = classify(norm(text))
      rec.detected = result
      rec.status = result.status
      rec.bill_as = result.billAs || 'ignore'
      console.log('📋 Classification result:', {
        status: result.status,
        billAs: result.billAs,
        def: result.def?.label,
        confidence: result.confidence
      })
    }
  } catch (err) {
    if (err && err.code === 'password') {
      rec.status = 'password'
      rec.needPwd = true
    } else {
      rec.status = 'error'
      rec.errMsg = (err && err.message) || 'Could not read this file.'
      rec.bill_as = 'ignore'
    }
  }
  rec.file = file
  return rec
}

const STATUS_META = {
  processing: { cls: 'neutral', text: 'Reading…' },
  recognized: { cls: 'ok' },
  comprehensive: { cls: 'review', text: 'Comprehensive statement' },
  unrecognized: { cls: 'review', text: 'Not recognised — choose how to bill it' },
  scanned: { cls: 'bad', text: 'Scanned / image PDF — text not extractable' },
  password: { cls: 'bad', text: 'Password-protected' },
  unsupported: { cls: 'bad', text: 'Unsupported file type' },
  error: { cls: 'bad', text: "Couldn't read this file" }
}

const UploadDocuments = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [libsReady, setLibsReady] = useState(false)
  const [libsError, setLibsError] = useState(null)
  const [estimatedBill, setEstimatedBill] = useState({ lines: [], total: 0 })
  const [houseProperties, setHouseProperties] = useState(0)
  const [residentialStatus, setResidentialStatus] = useState('resident')
  const [missedStreams, setMissedStreams] = useState([])
  const [isBillExpanded, setIsBillExpanded] = useState(true)
  const [debugOpenIds, setDebugOpenIds] = useState(new Set())
  const fileInputRef = useRef(null)

  const toggleDebug = (id) => {
    setDebugOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    loadExtractionLibs()
      .then(() => { if (!cancelled) setLibsReady(true) })
      .catch(err => { if (!cancelled) setLibsError(err.message || 'Failed to load file-reading libraries.') })
    return () => { cancelled = true }
  }, [])

  const computeBill = useCallback(() => {
    const componentSource = {}
    let base = false

    files.forEach(f => {
      const map = BILL_AS[f.bill_as || 'ignore']
      if (!map) return
      if (map.base) base = true
      if (map.component && !componentSource[map.component]) componentSource[map.component] = f.name
      if (map.component) base = true
    })

    missedStreams.forEach(id => {
      if (!componentSource[id]) componentSource[id] = '__manual__'
      base = true
    })

    const propCount = Math.max(0, parseInt(houseProperties) || 0)
    if (propCount > 0) base = true

    const lines = []
    if (base) {
      lines.push({ kind: 'base', label: FEE_SCHEDULE.base.label, reason: 'Base fee for the return', amount: FEE_SCHEDULE.base.amount })
    }

    const extra = Math.max(0, propCount - 2)
    if (extra > 0) {
      lines.push({
        kind: 'detected',
        label: `House properties beyond 2 (${extra} × ${inr(FEE_SCHEDULE.hpExtra.amount)})`,
        reason: 'From property count',
        amount: extra * FEE_SCHEDULE.hpExtra.amount,
        src: 'property count'
      })
    }

    ;['cgImmovable', 'cgEquity', 'cgOther', 'bizPresumptive', 'bizAccounts'].forEach(k => {
      if (k in componentSource) {
        const fromFile = componentSource[k] !== '__manual__'
        lines.push({
          kind: fromFile ? 'detected' : 'manual',
          label: FEE_SCHEDULE[k].label,
          reason: fromFile ? 'Detected' : 'Added manually',
          src: fromFile ? componentSource[k] : 'manual',
          amount: FEE_SCHEDULE[k].amount
        })
      }
    })

    if (residentialStatus === 'nri') {
      lines.push({ kind: 'manual', label: FEE_SCHEDULE.nri.label, reason: 'Residential status', src: 'manual', amount: FEE_SCHEDULE.nri.amount })
    }
    if (residentialStatus === 'residentForeign') {
      lines.push({ kind: 'manual', label: FEE_SCHEDULE.residentForeign.label, reason: 'Residential status', src: 'manual', amount: FEE_SCHEDULE.residentForeign.amount })
    }

    const total = lines.reduce((s, l) => s + l.amount, 0)
    setEstimatedBill({ lines, total })
  }, [files, houseProperties, residentialStatus, missedStreams])

  useEffect(() => { computeBill() }, [computeBill])

  // ⭐ SINGLE SOURCE OF TRUTH: Upload and store classification ONCE
  const addFiles = async (fileList) => {
    if (!libsReady) {
      safeToast.error(libsError ? `File reader unavailable: ${libsError}` : 'File reader is still loading — try again in a second.')
      return
    }
    setUploading(true)

    for (const file of fileList) {
      const ext = file.name.split('.').pop().toLowerCase()

      if (!['pdf', 'xlsx', 'xls'].includes(ext)) {
        setFiles(prev => [...prev, {
          id: Date.now() + Math.random(), name: file.name, size: file.size,
          ext, status: 'unsupported', bill_as: 'ignore', file
        }])
        continue
      }

      if (files.some(f => f.name === file.name && f.size === file.size)) {
        safeToast.warning(`Duplicate file: ${file.name}`)
        continue
      }

      const rec = {
        id: Date.now() + Math.random(), name: file.name, size: file.size,
        ext, status: 'processing', bill_as: 'ignore', file
      }
      setFiles(prev => [...prev, rec])

      // ⭐ CLASSIFY ONCE
      const processedRec = await processFile(rec, file)
      setFiles(prev => prev.map(f => f.id === processedRec.id ? { ...processedRec } : f))

      console.log('✅ Final bill_as for', file.name, ':', processedRec.bill_as)

      if (processedRec.status === 'recognized' && processedRec.detected) {
        const billAsLabel = BILL_AS[processedRec.bill_as]?.label || processedRec.bill_as
        safeToast.success(`Detected: ${processedRec.detected.def.label} (${processedRec.detected.confidence} confidence)`)
        safeToast.info(`Bill as auto-set to: ${billAsLabel}`)
      } else if (processedRec.status === 'unrecognized') {
        safeToast.info('Document type not recognized. Please select from "Bill as" dropdown.')
      } else if (processedRec.status === 'comprehensive') {
        safeToast.info('Comprehensive statement detected. Review and select manually.')
      } else if (processedRec.status === 'error') {
        safeToast.error(`Couldn't read ${processedRec.name}: ${processedRec.errMsg}`)
      } else if (processedRec.status === 'scanned') {
        safeToast.warning(`${processedRec.name} looks like a scanned/image PDF — no extractable text.`)
      }
    }

    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileSelect = (e) => {
    addFiles(Array.from(e.target.files))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id) => setFiles(files.filter(f => f.id !== id))

  const handleBillAsChange = (id, value) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, bill_as: value } : f))
  }

  const retryPassword = async (file) => {
    const input = document.getElementById(`pwd-${file.id}`)
    if (!input || !file.file) return
    file.status = 'processing'
    setFiles(prev => [...prev])
    const processedRec = await processFile(file, file.file, input.value)
    setFiles(prev => prev.map(f => f.id === processedRec.id ? { ...processedRec } : f))
  }

  const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.error

  const getStatusBadge = (status) => {
    const meta = getStatusMeta(status)
    const colorMap = { ok: 'bg-green-100 text-green-700', review: 'bg-yellow-100 text-yellow-700', bad: 'bg-red-100 text-red-700', neutral: 'bg-gray-100 text-gray-600' }
    if (status === 'recognized') return null
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[meta.cls]}`}>{meta.text}</span>
  }

  const getClassificationBadge = (file) => {
    if (file.status === 'comprehensive') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Comprehensive statement</span>
    }
    if (file.status === 'recognized' && file.detected) {
      const confidenceColors = { high: 'bg-green-100 text-green-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-yellow-100 text-yellow-700' }
      const colorClass = confidenceColors[file.detected.confidence] || confidenceColors.low
      return (
        <span className={`text-xs ${colorClass} px-2 py-0.5 rounded-full`}>
          ✓ {file.detected.def?.label || 'Recognized'} · {file.detected.confidence} confidence
        </span>
      )
    }
    return null
  }

  const renderEvidence = (file) => {
    if (!file.detected || !file.detected.evidence || file.detected.evidence.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        <span className="text-[10px] text-gray-400 font-medium">matched:</span>
        {file.detected.evidence.slice(0, 5).map((word, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{word}</span>
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout title="Upload Documents" subtitle="Drop your documents and the estimate builds itself">
      {!libsReady && !libsError && (
        <div className="mb-4 text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading file-reading engine…
        </div>
      )}
      {libsError && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          Couldn't load the PDF/Excel reader ({libsError}). Check your network/ad-blocker and refresh.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-2">Drop files here, or click to choose</p>
            <p className="text-sm text-gray-400 mb-4">PDF &amp; Excel (.pdf, .xlsx, .xls) — processed in your browser</p>
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !libsReady}
            >
              {uploading ? (<><Loader2 className="animate-spin w-4 h-4 mr-2" />Uploading...</>) : !libsReady ? 'Loading reader…' : 'Browse Files'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-4">Supported formats: PDF, Excel (.xlsx, .xls) — Max 100MB</p>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Client Documents ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file) => {
                  const isProcessing = file.status === 'processing'
                  const meta = getStatusMeta(file.status)
                  return (
                    <div key={file.id} className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${isProcessing ? 'opacity-85' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {isProcessing ? <Loader2 className="w-5 h-5 text-primary-500 animate-spin" /> : <FileText className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500">{file.ext?.toUpperCase() || 'FILE'}</span>
                                {getStatusBadge(file.status)}
                                {getClassificationBadge(file)}
                              </div>
                              {meta && meta.text && ['scanned', 'password', 'unsupported', 'error', 'processing'].includes(file.status) && (
                                <div className={`text-xs mt-1 ${meta.cls === 'ok' ? 'text-green-600' : meta.cls === 'review' ? 'text-yellow-600' : meta.cls === 'neutral' ? 'text-gray-500' : 'text-red-600'}`}>
                                  {meta.text}{file.status === 'error' && file.errMsg ? ` — ${file.errMsg}` : ''}
                                </div>
                              )}
                              {file.status === 'unrecognized' && (
                                <div className="text-xs mt-1 text-yellow-600">Not recognised — choose how to bill it below.</div>
                              )}
                              {renderEvidence(file)}
                              {file.detected && file.detected.def?.note && (file.status === 'comprehensive' || file.status === 'recognized') && (
                                <div className={`mt-2 text-xs p-2 rounded border ${file.status === 'comprehensive' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-gray-500 bg-gray-50 border-gray-100'}`}>
                                  {file.detected.def.note}
                                </div>
                              )}
                              {file.status === 'password' && (
                                <div className="mt-2 flex items-center gap-2">
                                  <input type="password" placeholder="PDF password" className="text-sm border border-gray-300 rounded px-2 py-1" id={`pwd-${file.id}`} />
                                  <button className="btn-sm text-xs px-3 py-1" onClick={() => retryPassword(file)}>Unlock</button>
                                </div>
                              )}
                            </div>
                            <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                              <X size={20} />
                            </button>
                          </div>

                          {['recognized', 'comprehensive', 'unrecognized', 'scanned', 'error'].includes(file.status) && (
                            <button
                              onClick={() => toggleDebug(file.id)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 underline mt-1"
                            >
                              {debugOpenIds.has(file.id) ? 'Hide' : 'Why?'} extraction details
                            </button>
                          )}
                          {debugOpenIds.has(file.id) && (
                            <div className="mt-2 text-[11px] bg-gray-50 border border-gray-200 rounded p-2 space-y-2">
                              <div>
                                <span className="font-medium text-gray-600">Extracted text:</span>{' '}
                                <span className="text-gray-500">{file.rawTextLength ?? 0} chars</span>
                              </div>
                              {file.rawTextPreview && (
                                <pre className="whitespace-pre-wrap text-gray-500 bg-white border border-gray-100 rounded p-1.5 max-h-28 overflow-y-auto">{file.rawTextPreview}{(file.rawTextLength || 0) > 500 ? '…' : ''}</pre>
                              )}
                              {file.detected?.nearMisses?.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600">Closest document types:</span>
                                  <ul className="mt-1 space-y-1">
                                    {file.detected.nearMisses.map((nm, i) => (
                                      <li key={i} className="text-gray-500">
                                        {nm.label} — {nm.reqMet ? 'required phrase found' : `missing required phrase (e.g. "${nm.missingRequired[0]}")`}, supporting {nm.supHave}/{nm.supNeed}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!file.rawTextPreview && <div className="text-gray-500">No text could be extracted from this file.</div>}
                            </div>
                          )}

                          {/* Bill As Dropdown - Displays the classification from the file state */}
                          {['recognized', 'comprehensive', 'unrecognized'].includes(file.status) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Bill as</label>
                              <select
                                value={file.bill_as || 'ignore'}
                                onChange={(e) => handleBillAsChange(file.id, e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                              >
                                {Object.entries(BILL_AS).map(([key, value]) => (
                                  <option key={key} value={key}>
                                    {value.label}
                                  </option>
                                ))}
                              </select>
                              <span className="text-xs text-gray-400">({file.bill_as || 'ignore'})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Estimated Bill & Adjustments - Same as before */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setIsBillExpanded(!isBillExpanded)}>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Estimated Bill</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary-600">{estimatedBill.total > 0 ? inr(estimatedBill.total) : '—'}</span>
                {isBillExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {isBillExpanded && (
              <div className="p-4">
                {estimatedBill.lines.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Upload a document or add a stream to see the estimate.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {estimatedBill.lines.map((line, idx) => (
                      <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium text-gray-800">{line.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              line.kind === 'base' ? 'bg-gray-100 text-gray-600' :
                              line.kind === 'detected' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {line.kind === 'base' ? 'base' : line.kind}
                            </span>
                            {line.src && <span className="text-xs text-gray-400">· {line.src === 'manual' ? 'added manually' : line.src}</span>}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{inr(line.amount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                      <span className="text-base font-bold text-gray-900">Total estimate</span>
                      <span className="text-xl font-bold text-primary-600">{inr(estimatedBill.total)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">
                    Indicative estimate based on the documents and inputs above. Final fee is confirmed after computation of income; if actual volume or effort is higher than reasonable estimates, we will take prior approval before revising.
                  </p>
                </div>

                {estimatedBill.total > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="btn-primary text-sm px-4 py-2 flex-1"
                      onClick={() => {
                        const summary = estimatedBill.lines.map(l => `${l.label}: ${inr(l.amount)}${l.reason ? ` (${l.reason})` : ''}`)
                        const totalText = `Total: ${inr(estimatedBill.total)}`
                        navigator.clipboard.writeText([...summary, totalText].join('\n'))
                        safeToast.success('Summary copied to clipboard')
                      }}
                    >
                      Copy summary
                    </button>
                    <button
                      className="btn-outline text-sm px-4 py-2"
                      onClick={() => {
                        setFiles([])
                        setHouseProperties(0)
                        setResidentialStatus('resident')
                        setMissedStreams([])
                        safeToast.success('Cleared all')
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Shield className="w-3 h-3" />
                  Files are read locally in this browser. Nothing is uploaded to any server.
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mt-4">
            <h3 className="font-semibold text-sm mb-3">2 · Adjustments the documents can't show</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of house properties</label>
              <p className="text-xs text-gray-400 mb-2">The base fee covers up to 2. Each property beyond 2 adds ₹100.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={houseProperties}
                  onChange={(e) => setHouseProperties(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {files.some(f => f.bill_as === 'houseProperty') && (
                  <span className="text-xs text-gray-400">House-loan document detected — confirm the count.</span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Residential status</label>
              <p className="text-xs text-gray-400 mb-2">Not visible from any document — set it here.</p>
              <div className="space-y-1.5">
                {[
                  ['resident', 'Resident (no foreign income)'],
                  ['nri', 'Non-Resident Indian — adds ₹500'],
                  ['residentForeign', 'Resident with foreign income (DTAA / FTC / Form 67) — adds ₹750']
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="residentialStatus"
                      value={val}
                      checked={residentialStatus === val}
                      onChange={(e) => setResidentialStatus(e.target.value)}
                      className="w-4 h-4 text-primary-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add a stream with no document uploaded</label>
              <p className="text-xs text-gray-400 mb-2">For income the client mentioned but didn't (or couldn't) give a file for.</p>
              <div className="space-y-1.5">
                {MISSED_OPTIONS.map(id => {
                  const fee = FEE_SCHEDULE[id]
                  return (
                    <label key={id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={missedStreams.includes(id)}
                          onChange={(e) => {
                            if (e.target.checked) setMissedStreams([...missedStreams, id])
                            else setMissedStreams(missedStreams.filter(m => m !== id))
                          }}
                          className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm">{fee.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">+{inr(fee.amount)}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UploadDocuments