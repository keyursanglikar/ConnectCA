









// // src/pages/client/ClientDashboard.jsx
// import React, { useState, useEffect, useRef, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom'
// import DashboardLayout from '../../components/common/Layout/DashboardLayout'
// import {
//   FileText, Upload, X, Loader2, CheckCircle, Clock, AlertCircle,
//   Receipt, User, Mail, Building2, Trash2, Edit, ArrowUpRight,
//   ArrowDownRight, DollarSign, Calendar, FileCheck, Download, Eye,
//   Settings, LogOut, Menu, ChevronDown, ChevronRight, Search,
//   Filter, Grid, List, Printer, Copy, Check, AlertTriangle, Info,
//   Star, Shield, Lock, RefreshCw, ClipboardList, BookOpen, Home,
//   Building, TrendingUp, Globe, Users, Briefcase, Folder, FolderOpen,
//   MessageSquare, Bell, HelpCircle, Paperclip, CreditCard, Banknote,
//   Share2, Maximize2, Minimize2, ChevronLeft, Zap, Award, Sparkles,
//   BadgeCheck, ArrowRight
// } from 'lucide-react'
// import axios from 'axios'
// import safeToast from '../../utils/toast'
// import { format } from 'date-fns'
// import FeePamplatePopup from './FeePamplatePopup'
// import { feeApi } from '../../api/fee.api'

// /* ======================================================================
//    EXTERNAL LIBRARIES — loaded dynamically, once, on mount.
//    ====================================================================== */
// const CDN = {
//   pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
//   pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
//   xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
// }

// function loadScript(src) {
//   return new Promise((resolve, reject) => {
//     if ([...document.scripts].some(s => s.src === src)) return resolve()
//     const s = document.createElement('script')
//     s.src = src
//     s.async = true
//     s.onload = () => resolve()
//     s.onerror = () => reject(new Error(`Failed to load ${src}`))
//     document.head.appendChild(s)
//   })
// }

// async function loadExtractionLibs() {
//   await Promise.all([loadScript(CDN.pdfjs), loadScript(CDN.xlsx)])
//   if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
//     window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfjsWorker
//   }
// }

// // ============ FEE SCHEDULE ============
// const FEE_SCHEDULE = {
//   base: { label: 'Basic ITR Fee (Salary/House Property/Other Sources)', amount: 500 },
//   hpExtra: { label: 'Each House Property beyond 2', amount: 100 },
//   cgImmovable: { label: 'Capital Gains - Immovable Property', amount: 200 },
//   cgEquity: { label: 'Capital Gains - Equity/Debt/Mutual Funds', amount: 300 },
//   cgOther: { label: 'Capital Gains - Other (incl. F&O)', amount: 300 },
//   bizPresumptive: { label: 'Business Income - Without Accounts', amount: 500 },
//   bizAccounts: { label: 'Business Income - With Accounts', amount: 700 },
//   nri: { label: 'Non-Resident Indian (NRI)', amount: 500 },
//   residentForeign: { label: 'Resident with Foreign Income', amount: 750 }
// }

// // ============ BILL AS OPTIONS ============
// const BILL_AS_OPTIONS = [
//   { value: 'ignore', label: '— Ignore this file —' },
//   { value: 'salary', label: 'Salary (in base fee)', base: true },
//   { value: 'houseProperty', label: 'House Property (in base fee)', base: true },
//   { value: 'ifos', label: 'Other Sources (in base fee)', base: true },
//   { value: 'cgEquity', label: 'Capital Gains - Equity/Debt/MF', component: 'cgEquity' },
//   { value: 'cgImmovable', label: 'Capital Gains - Immovable', component: 'cgImmovable' },
//   { value: 'cgOther', label: 'Capital Gains - Other/F&O', component: 'cgOther' },
//   { value: 'bizPresumptive', label: 'Business - Without Financials', component: 'bizPresumptive' },
//   { value: 'bizAccounts', label: 'Business - With Financials', component: 'bizAccounts' }
// ]

// // ============ MISSED STREAMS OPTIONS ============
// const MISSED_OPTIONS = [
//   { id: 'cgImmovable', label: 'Capital Gains - Immovable Property', amount: 200 },
//   { id: 'cgEquity', label: 'Capital Gains - Equity/Debt/MF', amount: 300 },
//   { id: 'cgOther', label: 'Capital Gains - Other/F&O', amount: 300 },
//   { id: 'bizPresumptive', label: 'Business - Without Financials', amount: 500 },
//   { id: 'bizAccounts', label: 'Business - With Financials', amount: 700 }
// ]

// // ============ DOCUMENT DEFINITIONS ============
// const DOCUMENT_DEFINITIONS = [
//   {
//     id: 'form16', label: 'Form 16 — Salary TDS certificate', billAs: 'salary',
//     required: [['form no. 16', 'form no.16', 'form 16', 'form-16', 'certificate under section 203']],
//     supporting: [
//       ['traces'],
//       ['tan of the deductor', 'tan of deductor'],
//       ['gross salary', 'income chargeable under the head', 'salaries'],
//       ['pan of the employee', 'pan of employee', 'employee reference'],
//       ['quarter', 'period with the employer', 'assessment year']
//     ],
//     minSupporting: 2,
//     note: 'Salary is included in the base fee.'
//   },
//   {
//     id: 'interestCert', label: 'Bank / FD interest certificate', billAs: 'ifos',
//     required: [['interest certificate', 'interest income', 'interest earned', 'interest on fixed deposit', 'term deposit', 'interest on deposits']],
//     supporting: [
//       ['fixed deposit', 'term deposit', 'recurring deposit', 'savings account'],
//       ['interest credited', 'interest paid', 'interest accrued'],
//       ['tds', 'tax deducted at source'],
//       ['customer id', 'account number', 'ifsc', 'branch'],
//       ['financial year', 'assessment year']
//     ],
//     minSupporting: 1,
//     note: 'Interest income — included in the base fee.'
//   },
//   {
//     id: 'homeLoan', label: 'Home-loan interest certificate', billAs: 'houseProperty',
//     required: [['home loan', 'housing loan', 'loan account number', 'provisional certificate']],
//     supporting: [
//       ['interest', 'interest amount'],
//       ['principal', 'principal repaid', 'principal amount'],
//       ['provisional', 'final certificate'],
//       ['section 24', 'section 80c'],
//       ['property', 'property address', 'emi', 'tenure']
//     ],
//     minSupporting: 2,
//     note: 'House Property — included in base fee. Set the number of properties below.'
//   },
//   {
//     id: 'brokerCG', label: 'Broker capital-gains / Tax P&L statement', billAs: 'cgEquity',
//     required: [['capital gains statement', 'capital gain statement', 'tax p&l', 'tax pnl', 'realised p&l', 'realized p&l', 'short term capital gain', 'long term capital gain']],
//     supporting: [
//       ['short term', 'long term', 'stcg', 'ltcg'],
//       ['equity', 'shares', 'stocks', 'securities'],
//       ['mutual fund', 'mutual funds', 'units'],
//       ['zerodha', 'groww', 'upstox', 'angel one', 'icici direct', 'icicidirect', 'hdfc securities', 'kotak securities', '5paisa', 'dhan', 'paytm money'],
//       ['buy value', 'sell value', 'purchase value', 'sale value', 'cost of acquisition'],
//       ['isin', 'scrip', 'symbol', 'tradingsymbol']
//     ],
//     minSupporting: 2,
//     note: 'Capital Gains (equity/debt/MF) — adds ₹300.'
//   },
//   {
//     id: 'mfCG', label: 'Mutual fund capital-gains statement (CAMS/KFintech)', billAs: 'cgEquity',
//     required: [['capital gains statement', 'capital gain statement', 'statement of capital gains']],
//     supporting: [
//       ['cams', 'kfintech', 'karvy', 'camsonline', 'mfcentral'],
//       ['folio', 'folio number'],
//       ['amc', 'scheme', 'plan'],
//       ['redemption', 'purchase', 'switch', 'nav'],
//       ['short term', 'long term', 'grandfathered']
//     ],
//     minSupporting: 2,
//     note: 'Capital Gains (mutual funds) — adds ₹300.'
//   },
//   {
//     id: 'fno', label: 'F&O / derivatives statement', billAs: 'cgOther',
//     required: [['f&o', 'futures and options', 'derivatives', 'fno']],
//     supporting: [
//       ['turnover'],
//       ['futures', 'options'],
//       ['mtm', 'mark to market'],
//       ['strike', 'expiry', 'lot size'],
//       ['zerodha', 'groww', 'upstox', 'icici direct', 'dhan', 'angel one'],
//       ['realised', 'realized']
//     ],
//     minSupporting: 2,
//     note: "Treated as 'other capital gain (incl. F&O)' — adds ₹300."
//   },
//   {
//     id: 'financials', label: 'Financial statements (P&L / Balance Sheet)', billAs: 'bizAccounts',
//     required: [['balance sheet', 'statement of profit and loss', 'profit and loss account']],
//     supporting: [
//       ['capital account', 'proprietor', 'partners capital', "partner's capital"],
//       ['sundry debtors', 'sundry creditors'],
//       ['current assets', 'current liabilities', 'fixed assets'],
//       ['depreciation'],
//       ['trading account', 'gross profit', 'net profit'],
//       ['as at', 'for the year ended']
//     ],
//     minSupporting: 2,
//     note: 'Business income with accounts & financials — adds ₹700.'
//   },
//   {
//     id: 'comprehensive', label: 'AIS / TIS / Form 26AS', billAs: 'ignore', special: 'review',
//     required: [['annual information statement', 'taxpayer information summary', 'form 26as', 'annual tax statement']],
//     supporting: [
//       ['sft', 'specified financial transaction'],
//       ['tds', 'tcs'],
//       ['information category'],
//       ['permanent account number'],
//       ['assessment year']
//     ],
//     minSupporting: 1,
//     note: 'This single document covers many income heads at once. Review the streams it lists and tick them manually.'
//   }
// ]

// const SETTINGS = { minTextChars: 20 }
// const norm = (t) => (' ' + t + ' ').toLowerCase().replace(/\s+/g, ' ')

// function classifyDocument(text) {
//   const scored = DOCUMENT_DEFINITIONS.map(def => {
//     const reqGroupResults = def.required.map(g => ({ group: g, hit: g.find(p => text.includes(p)) || null }))
//     const reqOk = reqGroupResults.every(r => r.hit)
//     const supGroupResults = (def.supporting || []).map(g => ({ group: g, hit: g.find(p => text.includes(p)) || null }))
//     const supHits = supGroupResults.filter(r => r.hit)

//     const evidence = []
//     reqGroupResults.forEach(r => { if (r.hit) evidence.push(r.hit) })
//     supGroupResults.forEach(r => { if (r.hit) evidence.push(r.hit) })

//     const ok = reqOk && supHits.length >= (def.minSupporting || 0)
//     const score = (reqOk ? def.required.length * 2 : 0) + supHits.length

//     return {
//       def, ok, score, supCount: supHits.length,
//       evidence: [...new Set(evidence)].slice(0, 6),
//       missingRequired: reqGroupResults.filter(r => !r.hit).map(r => r.group[0]),
//       minSupporting: def.minSupporting || 0
//     }
//   })

//   const okMatches = scored.filter(s => s.ok).sort((a, b) => b.score - a.score)
//   const nearMisses = [...scored].sort((a, b) => b.score - a.score).slice(0, 3).map(s => ({
//     label: s.def.label,
//     reqMet: s.missingRequired.length === 0,
//     missingRequired: s.missingRequired,
//     supHave: s.supCount,
//     supNeed: s.minSupporting
//   }))

//   if (!okMatches.length) return { status: 'unrecognized', nearMisses }

//   const best = okMatches[0]
//   const confidence = best.supCount >= best.def.minSupporting + 1 ? 'high' : 'medium'

//   return {
//     status: best.def.special === 'review' ? 'comprehensive' : 'recognized',
//     def: best.def,
//     evidence: best.evidence,
//     confidence,
//     nearMisses
//   }
// }

// function reconstructPageText(items) {
//   const Y_TOLERANCE = 3
//   const rows = []
//   items.forEach(it => {
//     const x = it.transform[4]
//     const y = it.transform[5]
//     let row = rows.find(r => Math.abs(r.y - y) <= Y_TOLERANCE)
//     if (!row) { row = { y, cells: [] }; rows.push(row) }
//     row.cells.push({ x, str: it.str })
//   })
//   rows.sort((a, b) => b.y - a.y)
//   rows.forEach(r => r.cells.sort((a, b) => a.x - b.x))
//   return rows.map(r => r.cells.map(c => c.str).join(' ')).join('\n')
// }

// async function extractPdfText(file, password) {
//   if (!window.pdfjsLib) {
//     throw { code: 'lib_missing', message: 'PDF reader library not loaded yet.' }
//   }
//   const buf = await file.arrayBuffer()
//   let pdf
//   try {
//     pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf), password }).promise
//   } catch (e) {
//     if (e && e.name === 'PasswordException') throw { code: 'password' }
//     throw { code: 'pdf_error', message: (e && e.message) || 'Could not parse PDF.' }
//   }
//   let text = ''
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i)
//     const tc = await page.getTextContent()
//     text += reconstructPageText(tc.items) + '\n'
//   }
//   return text
// }

// async function extractExcelText(file) {
//   if (!window.XLSX) {
//     throw { code: 'lib_missing', message: 'Excel reader library not loaded yet.' }
//   }
//   const buf = await file.arrayBuffer()
//   const wb = window.XLSX.read(new Uint8Array(buf), { type: 'array' })
//   return wb.SheetNames.map(n => window.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')
// }

// async function extractAndClassify(file, password) {
//   const ext = file.name.split('.').pop().toLowerCase()
//   const out = { extractionStatus: 'processing', detected: null, billAs: 'ignore' }
//   try {
//     let text = ''
//     if (ext === 'pdf') text = await extractPdfText(file, password)
//     else if (['xlsx', 'xls'].includes(ext)) text = await extractExcelText(file)
//     else { out.extractionStatus = 'unsupported'; return out }

//     out.rawTextLength = text ? text.replace(/\s+/g, '').length : 0
//     out.rawTextPreview = text ? text.trim().slice(0, 500) : ''

//     if (!text || out.rawTextLength < SETTINGS.minTextChars) {
//       out.extractionStatus = 'scanned'
//       return out
//     }

//     const result = classifyDocument(norm(text))
//     out.detected = result
//     out.extractionStatus = result.status
//     out.billAs = result.def ? (result.def.special ? 'ignore' : result.def.billAs) : 'ignore'
//     return out
//   } catch (err) {
//     if (err && err.code === 'password') {
//       out.extractionStatus = 'password'
//       out.needPwd = true
//     } else {
//       out.extractionStatus = 'error'
//       out.errMsg = (err && err.message) || 'Could not read this file.'
//     }
//     return out
//   }
// }

// const EXTRACTION_META = {
//   processing: { cls: 'neutral', text: 'Reading…' },
//   recognized: { cls: 'ok', text: null },
//   comprehensive: { cls: 'review', text: 'Comprehensive statement' },
//   unrecognized: { cls: 'review', text: 'Not recognised — choose how to bill it' },
//   scanned: { cls: 'bad', text: 'Scanned / image PDF — text not extractable' },
//   password: { cls: 'bad', text: 'Password-protected' },
//   unsupported: { cls: 'bad', text: 'Unsupported file type' },
//   error: { cls: 'bad', text: "Couldn't read this file" }
// }

// const ClientDashboard = () => {
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [documents, setDocuments] = useState([])
//   const [feePamphlet, setFeePamphlet] = useState(null)
//   const [bills, setBills] = useState([])
//   const [clientData, setClientData] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [houseProperties, setHouseProperties] = useState(0)
//   const [residentialStatus, setResidentialStatus] = useState('resident')
//   const [missedStreams, setMissedStreams] = useState([])
//   const [estimatedBill, setEstimatedBill] = useState({ lines: [], total: 0 })
//   const [isDragging, setIsDragging] = useState(false)
//   const fileInputRef = useRef(null)
//   const [processingFiles, setProcessingFiles] = useState({})
//   const [feePamphletLoading, setFeePamphletLoading] = useState(true)
//   const [libsReady, setLibsReady] = useState(false)
//   const [libsError, setLibsError] = useState(null)
//   const [debugOpenIds, setDebugOpenIds] = useState(new Set())
//   const [sendingToCA, setSendingToCA] = useState(false)
//   const [sentToCA, setSentToCA] = useState(false)
//   const [sentToCAAt, setSentToCAAt] = useState(null)

//   // ✅ Ref to prevent double submission
//   const isSendingRef = useRef(false)

//   // Fee pamphlet popup states
//   const [showFeePopup, setShowFeePopup] = useState(false)
//   const [checkingFeeStatus, setCheckingFeeStatus] = useState(true)
//   const [feeAccepted, setFeeAccepted] = useState(false)
//   const [hasCheckedFee, setHasCheckedFee] = useState(false)
//   const [feeStatus, setFeeStatus] = useState(null)
//   const [pamplateData, setPamplateData] = useState(null)
//   const [hasNewItems, setHasNewItems] = useState(false)

//   // Fee pamphlet popup toggle (for the logo click)
//   const [showFeePamphletPopup, setShowFeePamphletPopup] = useState(false)

//   // Computation Bill states
//   const [computationBill, setComputationBill] = useState(null)
//   const [computationBillLoading, setComputationBillLoading] = useState(false)
//   const [proceedingToCA, setProceedingToCA] = useState(false)
//   const [cancellingBill, setCancellingBill] = useState(false)
//   const [confirmingBill, setConfirmingBill] = useState(false)

//   const [stats, setStats] = useState({
//     totalDocuments: 0,
//     pendingDocuments: 0,
//     approvedDocuments: 0,
//     totalBills: 0,
//     pendingBills: 0,
//     totalAmount: 0
//   })

//   // Load extraction libs on mount
//   useEffect(() => {
//     let cancelled = false
//     loadExtractionLibs()
//       .then(() => { if (!cancelled) setLibsReady(true) })
//       .catch(err => { if (!cancelled) setLibsError(err.message || 'Failed to load file-reading libraries.') })
//     return () => { cancelled = true }
//   }, [])

//   // Load data on mount
//   useEffect(() => {
//     const loadData = async () => {
//       await fetchClientData()
//     }
//     loadData()
//   }, [])

//   useEffect(() => {
//     computeEstimate()
//   }, [documents, houseProperties, residentialStatus, missedStreams])

//   // Fetch computation bill on mount and when submissions change
//   useEffect(() => {
//     fetchComputationBill()
//   }, [])

//   // ============ FEE PAMPHLET STATUS CHECK ============
//   const checkFeePamphletStatus = async () => {
//     setCheckingFeeStatus(true)
//     try {
//       const status = await feeApi.getMyPamplateStatus()
//       setFeeStatus(status)
      
//       console.log('📋 Fee Pamphlet Status:', status)
      
//       if (!status.has_pamplate) {
//         console.log('📋 No fee pamphlet found')
//         setFeeAccepted(false)
//         setShowFeePopup(false)
//         setPamplateData(null)
//         setCheckingFeeStatus(false)
//         return
//       }
      
//       if (status.has_accepted) {
//         console.log('✅ Fee pamphlet already accepted')
//         setFeeAccepted(true)
//         setShowFeePopup(false)
//         setHasNewItems(false)
//         setHasCheckedFee(true)
//         setCheckingFeeStatus(false)
//         return
//       }
      
//       if (status.has_rejected) {
//         console.log('❌ Fee pamphlet rejected')
//         setFeeAccepted(false)
//         setShowFeePopup(false)
//         setHasCheckedFee(true)
//         setCheckingFeeStatus(false)
//         return
//       }
      
//       console.log('📋 Fee pamphlet needs acceptance - showing popup')
      
//       try {
//         const data = await feeApi.getMyPamplate()
//         setPamplateData(data)
        
//         if (data.previous_accepted_fee_ids && data.fee_data) {
//           const newItems = data.fee_data.filter(
//             item => !data.previous_accepted_fee_ids.includes(item.id)
//           )
//           if (newItems.length > 0) {
//             setHasNewItems(true)
//             console.log(`📋 ${newItems.length} new fee items added`)
//           }
//         }
//       } catch (err) {
//         console.error('Error fetching pamphlet data:', err)
//       }
      
//       setFeeAccepted(false)
//       setShowFeePopup(true)
//       setHasCheckedFee(true)
//       setCheckingFeeStatus(false)
      
//     } catch (error) {
//       console.error('Error checking fee pamphlet status:', error)
//       if (error.response?.status === 401) {
//         localStorage.removeItem('access_token')
//         navigate('/login')
//       }
//       setHasCheckedFee(true)
//       setCheckingFeeStatus(false)
//     }
//   }

//   // ============ HANDLE FEE ACCEPTANCE ============
//   const handleFeeAcceptance = () => {
//     console.log('✅ Fee pamphlet accepted!')
//     setFeeAccepted(true)
//     setShowFeePopup(false)
//     setHasCheckedFee(true)
//     setHasNewItems(false)
    
//     safeToast.success('Fee pamphlet accepted! You can now access your dashboard.')
    
//     setTimeout(() => {
//       fetchClientData()
//     }, 500)
//   }

//   // ============ FETCH COMPUTATION BILL ============
//   const fetchComputationBill = useCallback(async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       let submissionsRes
//       try {
//         submissionsRes = await axios.get(`${API_URL}/submissions/client/my-submissions`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//       } catch (err) {
//         if (err.response?.status === 404) {
//           setComputationBill(null)
//           setComputationBillLoading(false)
//           return
//         }
//         throw err
//       }
      
//       const submissions = submissionsRes.data || []
//       if (submissions.length === 0) {
//         setComputationBill(null)
//         setComputationBillLoading(false)
//         return
//       }
      
//       const sortedSubmissions = [...submissions].sort((a, b) => 
//         new Date(b.created_at) - new Date(a.created_at)
//       )
      
//       const priorityStatuses = ['BILL_SENT', 'BILL_CONFIRMED', 'CONFIRMED', 'BILL_GENERATED']
//       const prioritySubs = sortedSubmissions.filter(s => 
//         priorityStatuses.includes(s.status)
//       )
      
//       const allSubsToCheck = [...prioritySubs, ...sortedSubmissions]
      
//       for (const sub of allSubsToCheck) {
//         try {
//           const billRes = await axios.get(`${API_URL}/submissions/${sub.id}/computation-bill`, {
//             headers: { 'Authorization': `Bearer ${token}` }
//           })
          
//           if (billRes.data.has_bill && billRes.data.bill_data) {
//             const billStatus = billRes.data.status || 'DRAFT'
//             if (billStatus === 'SENT_TO_CLIENT' || 
//                 billStatus === 'SENT' || 
//                 billStatus === 'CONFIRMED_BY_CLIENT' || 
//                 billStatus === 'CONFIRMED') {
//               setComputationBill({
//                 ...billRes.data.bill_data,
//                 status: billStatus,
//                 submission_id: sub.id,
//                 submission_status: sub.status
//               })
//               setComputationBillLoading(false)
//               return
//             }
//           }
//         } catch (billErr) {
//           continue
//         }
//       }
      
//       setComputationBill(null)
//     } catch (error) {
//       console.error('Error fetching computation bill:', error)
//       setComputationBill(null)
//     } finally {
//       setComputationBillLoading(false)
//     }
//   }, [])

//   // ============ FETCH DATA ============
//   const fetchClientData = async () => {
//     setIsLoading(true)
//     setFeePamphletLoading(true)
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

//       const profileRes = await axios.get(`${API_URL}/client/profile`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setClientData(profileRes.data)

//       const docsRes = await axios.get(`${API_URL}/client/documents`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })

//       const docsWithClassification = (docsRes.data || []).map(doc => ({
//         ...doc,
//         detected: null,
//         extractionStatus: doc.bill_as ? 'recognized' : undefined,
//         bill_as: doc.bill_as || 'ignore'
//       }))

//       setDocuments(docsWithClassification)

//       try {
//         const feeRes = await axios.get(`${API_URL}/fees/my-pamplate`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//         setFeePamphlet(feeRes.data)
//         setPamplateData(feeRes.data)
        
//         if (feeRes.data.accepted_at) {
//           setFeeAccepted(true)
//           setShowFeePopup(false)
//           setHasCheckedFee(true)
//           setCheckingFeeStatus(false)
//         }
//       } catch (err) {
//         setFeePamphlet(null)
//         setPamplateData(null)
//       } finally {
//         setFeePamphletLoading(false)
//       }

//       let billsData = []
//       try {
//         const billsRes = await axios.get(`${API_URL}/bills/client/my-bills`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//         })
//         billsData = billsRes.data || []
//         setBills(billsData)
//       } catch (err) {
//         setBills([])
//       }

//       const docs = docsRes.data || []
//       setStats({
//         totalDocuments: docs.length,
//         pendingDocuments: docs.filter(d => {
//           const status = (d.status || '').toLowerCase()
//           return status === 'pending_upload' || status === 'uploaded'
//         }).length,
//         approvedDocuments: docs.filter(d => (d.status || '').toLowerCase() === 'approved').length,
//         totalBills: billsData.length,
//         pendingBills: billsData.filter(b => b.status === 'pending').length,
//         totalAmount: billsData.reduce((sum, b) => sum + parseFloat(b.grand_total || 0), 0)
//       })

//       await checkFeePamphletStatus()
//       await fetchComputationBill()

//     } catch (error) {
//       console.error('Error fetching client data:', error)
//       if (error.response?.status === 401) {
//         localStorage.removeItem('access_token')
//         navigate('/login')
//       } else {
//         safeToast.error('Failed to load dashboard data')
//       }
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // ============ COMPUTE ESTIMATE ============
//   const computeEstimate = () => {
//     const componentSource = {}
//     let base = false

//     documents.forEach(doc => {
//       const billAs = doc.bill_as || 'ignore'
//       const option = BILL_AS_OPTIONS.find(o => o.value === billAs)
//       if (!option) return
//       if (option.base) base = true
//       if (option.component && !componentSource[option.component]) {
//         componentSource[option.component] = doc.file_title || doc.document_type
//       }
//       if (option.component) base = true
//     })

//     missedStreams.forEach(id => {
//       if (!componentSource[id]) componentSource[id] = '__manual__'
//       base = true
//     })

//     const propCount = Math.max(0, parseInt(houseProperties) || 0)
//     if (propCount > 0) base = true

//     const lines = []
//     if (base) {
//       lines.push({ kind: 'base', label: FEE_SCHEDULE.base.label, reason: 'Base fee for the return', amount: FEE_SCHEDULE.base.amount })
//     }

//     const extra = Math.max(0, propCount - 2)
//     if (extra > 0) {
//       lines.push({
//         kind: 'detected',
//         label: `House properties beyond 2 (${extra} × ₹${FEE_SCHEDULE.hpExtra.amount})`,
//         reason: 'From property count',
//         amount: extra * FEE_SCHEDULE.hpExtra.amount,
//         src: 'property count'
//       })
//     }

//     ;['cgImmovable', 'cgEquity', 'cgOther', 'bizPresumptive', 'bizAccounts'].forEach(k => {
//       if (k in componentSource) {
//         const fromFile = componentSource[k] !== '__manual__'
//         lines.push({
//           kind: fromFile ? 'detected' : 'manual',
//           label: FEE_SCHEDULE[k].label,
//           reason: fromFile ? 'Detected from document' : 'Added manually',
//           src: fromFile ? componentSource[k] : 'manual',
//           amount: FEE_SCHEDULE[k].amount
//         })
//       }
//     })

//     if (residentialStatus === 'nri') {
//       lines.push({ kind: 'manual', label: FEE_SCHEDULE.nri.label, reason: 'Residential status: NRI', src: 'manual', amount: FEE_SCHEDULE.nri.amount })
//     }
//     if (residentialStatus === 'residentForeign') {
//       lines.push({ kind: 'manual', label: FEE_SCHEDULE.residentForeign.label, reason: 'Residential status: Resident with Foreign Income', src: 'manual', amount: FEE_SCHEDULE.residentForeign.amount })
//     }

//     const total = lines.reduce((s, l) => s + l.amount, 0)
//     setEstimatedBill({ lines, total })
//   }

//   // ============ FILE HANDLING ============
//   const handleDrop = (e) => {
//     e.preventDefault()
//     setIsDragging(false)
//     handleFiles(Array.from(e.dataTransfer.files))
//   }

//   const handleFileSelect = (e) => {
//     handleFiles(Array.from(e.target.files))
//     if (fileInputRef.current) fileInputRef.current.value = ''
//   }

//   const handleFiles = async (files) => {
//     if (!libsReady) {
//       safeToast.error(libsError ? `File reader unavailable: ${libsError}` : 'File reader is still loading — try again in a second.')
//       return
//     }
//     for (const file of files) {
//       await uploadFile(file)
//     }
//   }

//   const uploadFile = async (file) => {
//     const fileExt = file.name.split('.').pop().toLowerCase()
//     const isPdf = fileExt === 'pdf'
//     const isExcel = ['xlsx', 'xls'].includes(fileExt)

//     if (!isPdf && !isExcel) {
//       safeToast.error(`${file.name} - Unsupported file type. Please upload PDF or Excel.`)
//       return
//     }

//     setUploading(true)
//     setProcessingFiles(prev => ({ ...prev, [file.name]: true }))

//     const extraction = await extractAndClassify(file)

//     if (extraction.extractionStatus === 'recognized' && extraction.detected) {
//       safeToast.success(`Detected: ${extraction.detected.def.label} (${extraction.detected.confidence} confidence)`)
//     } else if (extraction.extractionStatus === 'unrecognized') {
//       safeToast.info('Document type not recognized from its contents — please select "Bill as" manually.')
//     } else if (extraction.extractionStatus === 'comprehensive') {
//       safeToast.info('Comprehensive statement (AIS/26AS) detected — review and select manually.')
//     } else if (extraction.extractionStatus === 'scanned') {
//       safeToast.warning(`${file.name} looks like a scanned/image file — no extractable text, so it can't be auto-classified.`)
//     } else if (extraction.extractionStatus === 'error') {
//       safeToast.error(`Couldn't read ${file.name}: ${extraction.errMsg}`)
//     }

//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

//       const formData = new FormData()
//       formData.append('file', file)
//       formData.append('document_type', fileExt.toUpperCase())
//       formData.append('file_title', file.name)
//       formData.append('bill_as', extraction.billAs)
//       if (extraction.detected?.def?.label) {
//         formData.append('detected_label', extraction.detected.def.label)
//       }

//       const response = await axios.post(
//         `${API_URL}/client/upload-document`,
//         formData,
//         { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
//       )

//       const newDoc = {
//         ...response.data,
//         detected: extraction.detected,
//         extractionStatus: extraction.extractionStatus,
//         rawTextLength: extraction.rawTextLength,
//         rawTextPreview: extraction.rawTextPreview,
//         bill_as: response.data?.bill_as || extraction.billAs
//       }

//       setDocuments(prev => [...prev, newDoc])
//       setSentToCA(false)
//       safeToast.success(`Uploaded: ${file.name}`)
//     } catch (error) {
//       console.error('Error uploading file:', error)
//       const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload'
//       safeToast.error(`Failed to upload ${file.name}: ${errorMsg}`)
//     } finally {
//       setUploading(false)
//       setProcessingFiles(prev => ({ ...prev, [file.name]: false }))
//     }
//   }

//   const handleBillAsChange = (docId, value) => {
//     setDocuments(prev =>
//       prev.map(doc => doc.id === docId ? { ...doc, bill_as: value } : doc)
//     )
//   }

//   const handleRemoveDocument = async (docId) => {
//     if (!window.confirm('Are you sure you want to remove this document?')) return
    
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       await axios.delete(`${API_URL}/client/documents/${docId}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
      
//       setDocuments(prev => prev.filter(doc => doc.id !== docId))
//       safeToast.success('Document removed successfully')
//       fetchClientData()
//     } catch (error) {
//       console.error('Error removing document:', error)
//       if (error.response?.status === 403) {
//         safeToast.error('You don\'t have permission to delete this document')
//       } else if (error.response?.status === 404) {
//         safeToast.error('Document not found')
//       } else {
//         safeToast.error('Failed to remove document')
//       }
//     }
//   }

//   // ============ SEND TO CA - WITH DOUBLE SUBMISSION FIX ============
//   const handleSendToCA = async () => {
//     // ✅ Prevent double submission
//     if (isSendingRef.current) {
//       console.log('⏳ Submission already in progress, skipping duplicate request')
//       return
//     }

//     if (documents.length === 0) {
//       safeToast.warning('Add at least one document before sending to your CA.')
//       return
//     }

//     // ✅ Check if already sent and confirm resend
//     if (sentToCA) {
//       const confirmSend = window.confirm(
//         'You have already sent this estimate to your CA. Do you want to send it again?'
//       )
//       if (!confirmSend) return
//     }

//     // ✅ Set sending flag to prevent double submission
//     isSendingRef.current = true
//     setSendingToCA(true)
    
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

//       const payload = {
//         document_ids: documents.map(doc => doc.id),
//         adjustments: {
//           house_properties: Math.max(0, parseInt(houseProperties) || 0),
//           residential_status: residentialStatus,
//           missed_streams: missedStreams
//         },
//         estimated_bill: {
//           lines: estimatedBill.lines.map(l => ({
//             label: l.label,
//             amount: l.amount,
//             kind: l.kind,
//             source: l.src || null
//           })),
//           total: estimatedBill.total
//         }
//       }

//       console.log('📤 Sending to CA...', { 
//         documentCount: documents.length,
//         totalEstimate: estimatedBill.total,
//         adjustments: payload.adjustments
//       })

//       const response = await axios.post(`${API_URL}/client/send-to-ca`, payload, {
//         headers: { 
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       })

//       console.log('✅ Send to CA response:', response.data)

//       setSentToCA(true)
//       setSentToCAAt(new Date())
      
//       // ✅ Show detailed success message
//       let successMsg = `✅ Sent to your CA for review! (${response.data.document_count} documents)`
//       if (response.data.onedrive_uploaded) {
//         successMsg += ' 📁 Files uploaded to OneDrive'
//       } else if (response.data.onedrive_error) {
//         successMsg += ` ⚠️ OneDrive upload: ${response.data.onedrive_error}`
//       }
      
//       safeToast.success(successMsg)
//       safeToast.info(`📋 Submission #${response.data.submission_id} created`)
      
//       // ✅ If OneDrive folder URL is available, show it
//       if (response.data.onedrive_folder_url) {
//         safeToast.info('📁 Documents available in OneDrive folder')
//       }
      
//       await fetchClientData()
      
//     } catch (error) {
//       console.error('❌ Error sending to CA:', error)
//       const errorMsg = error.response?.data?.detail || error.message || 'Failed to send to CA'
//       safeToast.error(errorMsg)
//     } finally {
//       // ✅ Reset sending flag
//       isSendingRef.current = false
//       setSendingToCA(false)
//     }
//   }

//   // ============ HANDLE CONFIRM & PROCEED TO CA ============
//   const handleConfirmAndProceed = async () => {
//     if (!computationBill?.submission_id) {
//       safeToast.error('No submission found')
//       return
//     }
    
//     if (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') {
//       safeToast.info('This bill has already been confirmed')
//       return
//     }
    
//     setConfirmingBill(true)
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       const confirmResponse = await axios.post(
//         `${API_URL}/submissions/${computationBill.submission_id}/computation-bill/confirm`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )
      
//       if (confirmResponse.data) {
//         safeToast.success('✅ Bill confirmed!')
        
//         setConfirmingBill(false)
//         setProceedingToCA(true)
        
//         const proceedResponse = await axios.post(
//           `${API_URL}/submissions/${computationBill.submission_id}/proceed`,
//           {},
//           { headers: { 'Authorization': `Bearer ${token}` } }
//         )
        
//         safeToast.success('✅ Submitted to CA successfully!')
//         setComputationBill(prev => ({
//           ...prev,
//           status: 'CONFIRMED_BY_CLIENT',
//           confirmed_at: new Date().toISOString()
//         }))
        
//         await fetchClientData()
//       }
      
//     } catch (error) {
//       console.error('Error confirming and proceeding:', error)
      
//       if (error.response?.data?.detail?.includes('already confirmed')) {
//         try {
//           const token = localStorage.getItem('access_token')
//           const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
          
//           setConfirmingBill(false)
//           setProceedingToCA(true)
          
//           const proceedResponse = await axios.post(
//             `${API_URL}/submissions/${computationBill.submission_id}/proceed`,
//             {},
//             { headers: { 'Authorization': `Bearer ${token}` } }
//           )
          
//           safeToast.success('✅ Submitted to CA successfully!')
//           setComputationBill(prev => ({
//             ...prev,
//             status: 'CONFIRMED_BY_CLIENT',
//             confirmed_at: new Date().toISOString()
//           }))
          
//           await fetchClientData()
//           return
//         } catch (proceedErr) {
//           console.error('Error proceeding after confirmation:', proceedErr)
//         }
//       }
      
//       const errorMsg = error.response?.data?.detail || 'Failed to proceed'
//       safeToast.error(errorMsg)
//     } finally {
//       setConfirmingBill(false)
//       setProceedingToCA(false)
//     }
//   }

//   // ============ HANDLE CANCEL COMPUTATION BILL ============
//   const handleCancelComputationBill = async () => {
//     if (!window.confirm('Are you sure you want to cancel this computation bill? Your CA will be notified.')) {
//       return
//     }
    
//     setCancellingBill(true)
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       await axios.post(
//         `${API_URL}/submissions/${computationBill.submission_id}/cancel`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )
      
//       safeToast.info('Computation bill cancelled. Your CA has been notified.')
//       setComputationBill(null)
//       await fetchClientData()
      
//     } catch (error) {
//       console.error('Error cancelling computation bill:', error)
//       safeToast.error('Failed to cancel computation bill')
//     } finally {
//       setCancellingBill(false)
//     }
//   }

//   // ============ TOGGLE DEBUG ============
//   const toggleDebug = (id) => {
//     setDebugOpenIds(prev => {
//       const next = new Set(prev)
//       if (next.has(id)) next.delete(id); else next.add(id)
//       return next
//     })
//   }

//   // ============ STATUS BADGE ============
//   const getStatusBadge = (status) => {
//     const normalizedStatus = (status || '').toLowerCase()
//     const statusMap = {
//       'pending_upload': { label: 'Pending Upload', color: 'bg-yellow-100 text-yellow-700' },
//       'uploaded': { label: 'Uploaded', color: 'bg-blue-100 text-blue-700' },
//       'approved': { label: 'Approved', color: 'bg-green-100 text-green-700' },
//       'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700' },
//       're_upload_required': { label: 'Re-upload Required', color: 'bg-orange-100 text-orange-700' }
//     }
//     const config = statusMap[normalizedStatus] || statusMap['pending_upload']
//     return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
//   }

//   // ============ CLASSIFICATION BADGE ============
//   const getClassificationBadge = (doc) => {
//     if (doc.extractionStatus === 'comprehensive') {
//       return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Comprehensive statement</span>
//     }
//     if (doc.extractionStatus === 'recognized' && doc.detected) {
//       return (
//         <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//           ✓ {doc.detected.def.label} · {doc.detected.confidence} confidence
//         </span>
//       )
//     }
//     if (doc.extractionStatus === 'unrecognized') {
//       return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Not recognised — choose manually</span>
//     }
//     if (['scanned', 'password', 'unsupported', 'error'].includes(doc.extractionStatus)) {
//       const meta = EXTRACTION_META[doc.extractionStatus]
//       return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{meta.text}</span>
//     }
//     return null
//   }

//   // ============ COMPUTATION BILL STATUS BADGE ============
//   const getComputationBillStatusBadge = (status) => {
//     const statusMap = {
//       'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
//       'SENT_TO_CLIENT': { label: 'Sent to You', color: 'bg-blue-100 text-blue-700' },
//       'SENT': { label: 'Sent to You', color: 'bg-blue-100 text-blue-700' },
//       'CONFIRMED_BY_CLIENT': { label: 'Confirmed ✓', color: 'bg-green-100 text-green-700' },
//       'CONFIRMED': { label: 'Confirmed ✓', color: 'bg-green-100 text-green-700' },
//       'CANCELLED_BY_CLIENT': { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
//       'FINALIZED': { label: 'Finalized', color: 'bg-purple-100 text-purple-700' }
//     }
//     const config = statusMap[status] || statusMap['DRAFT']
//     return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
//   }

//   // ============ LOADING STATE ============
//   if (isLoading || checkingFeeStatus) {
//     return (
//       <DashboardLayout title="Dashboard" subtitle="Loading...">
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
//           <span className="ml-2 text-gray-500">Loading...</span>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   // ============ SHOW POPUP WHEN FEE NOT ACCEPTED ============
//   if (!feeAccepted && showFeePopup) {
//     return (
//       <>
//         <DashboardLayout title="Dashboard" subtitle="Review fee pamphlet">
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-4" />
//               <p className="text-gray-500">Please review the fee pamphlet to continue...</p>
//             </div>
//           </div>
//         </DashboardLayout>
//         <FeePamplatePopup 
//           isOpen={showFeePopup} 
//           onAccept={handleFeeAcceptance}
//           isViewOnly={false}
//           initialData={pamplateData}
//           statusData={feeStatus}
//         />
//       </>
//     )
//   }

//   // ============ MAIN RENDER ============
//   return (
//     <DashboardLayout
//       title="ITR Fee Estimator"
//       subtitle="Drop your documents and the estimate builds itself"
//     >
//       {!libsReady && !libsError && (
//         <div className="mb-4 text-xs text-gray-500 flex items-center gap-2">
//           <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading file-reading engine…
//         </div>
//       )}
//       {libsError && (
//         <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
//           Couldn't load the PDF/Excel reader ({libsError}). Check your network/ad-blocker and refresh.
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* LEFT: Upload & Documents (8 columns) */}
//         <div className="lg:col-span-8 space-y-6">
//           {/* Drop Zone */}
//           <div
//             className={`bg-white rounded-xl shadow-sm p-6 border-2 border-dashed transition-all ${
//               isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
//             }`}
//             onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
//             onDragLeave={() => setIsDragging(false)}
//             onDrop={handleDrop}
//           >
//             <div className="text-center cursor-pointer" onClick={() => libsReady && fileInputRef.current?.click()}>
//               <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
//               <p className="text-lg font-semibold text-gray-700">
//                 {libsReady ? 'Drop files here, or click to choose' : 'Loading reader…'}
//               </p>
//               <p className="text-sm text-gray-400 mt-1">PDF &amp; Excel — read and matched by content, not filename</p>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".pdf,.xlsx,.xls"
//                 multiple
//                 onChange={handleFileSelect}
//                 className="hidden"
//                 disabled={!libsReady}
//               />
//             </div>
//             {uploading && (
//               <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
//                 <Loader2 className="animate-spin w-4 h-4" />
//                 Reading &amp; uploading...
//               </div>
//             )}
//           </div>

//           {/* Uploaded Files */}
//           {documents.length > 0 && (
//             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//               <h3 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
//               <div className="space-y-3">
//                 {documents.map((doc) => {
//                   const isProcessing = processingFiles[doc.file_title]
//                   return (
//                     <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
//                       <div className="flex items-start gap-3">
//                         <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
//                           {isProcessing ? (
//                             <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
//                           ) : (
//                             <FileText className="w-4 h-4 text-gray-500" />
//                           )}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between gap-2">
//                             <div className="flex-1 min-w-0">
//                               <p className="font-medium text-sm truncate">{doc.file_title}</p>
//                               <div className="flex items-center gap-2 mt-1 flex-wrap">
//                                 <span className="text-xs text-gray-500">{doc.document_type}</span>
//                                 {getStatusBadge(doc.status)}
//                                 {getClassificationBadge(doc)}
//                               </div>
//                             </div>
//                             <button
//                               onClick={() => handleRemoveDocument(doc.id)}
//                               className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
//                             >
//                               <X className="w-4 h-4" />
//                             </button>
//                           </div>

//                           {doc.extractionStatus && (
//                             <button
//                               onClick={() => toggleDebug(doc.id)}
//                               className="text-[11px] text-gray-400 hover:text-gray-600 underline mt-1"
//                             >
//                               {debugOpenIds.has(doc.id) ? 'Hide' : 'Why?'} extraction details
//                             </button>
//                           )}
//                           {debugOpenIds.has(doc.id) && (
//                             <div className="mt-2 text-[11px] bg-gray-50 border border-gray-200 rounded p-2 space-y-2">
//                               <div>
//                                 <span className="font-medium text-gray-600">Extracted text:</span>{' '}
//                                 <span className="text-gray-500">{doc.rawTextLength ?? 0} chars</span>
//                               </div>
//                               {doc.rawTextPreview && (
//                                 <pre className="whitespace-pre-wrap text-gray-500 bg-white border border-gray-100 rounded p-1.5 max-h-28 overflow-y-auto">
//                                   {doc.rawTextPreview}{(doc.rawTextLength || 0) > 500 ? '…' : ''}
//                                 </pre>
//                               )}
//                               {doc.detected?.nearMisses?.length > 0 && (
//                                 <div>
//                                   <span className="font-medium text-gray-600">Closest document types:</span>
//                                   <ul className="mt-1 space-y-1">
//                                     {doc.detected.nearMisses.map((nm, i) => (
//                                       <li key={i} className="text-gray-500">
//                                         {nm.label} — {nm.reqMet ? 'required phrase found' : `missing required phrase (e.g. "${nm.missingRequired[0]}")`}, supporting {nm.supHave}/{nm.supNeed}
//                                       </li>
//                                     ))}
//                                   </ul>
//                                 </div>
//                               )}
//                               {!doc.rawTextPreview && (
//                                 <div className="text-gray-500">
//                                   No text was extracted for this file.
//                                 </div>
//                               )}
//                             </div>
//                           )}

//                           {/* Bill As Dropdown */}
//                           <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
//                             <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Bill as</label>
//                             <select
//                               value={doc.bill_as || 'ignore'}
//                               onChange={(e) => handleBillAsChange(doc.id, e.target.value)}
//                               className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
//                             >
//                               {BILL_AS_OPTIONS.map(option => (
//                                 <option key={option.value} value={option.value}>
//                                   {option.label}
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>
//           )}

//           {/* Adjustments */}
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//             <h3 className="font-semibold text-gray-900 mb-4">2 · Adjustments the documents can't show</h3>

//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Number of house properties
//               </label>
//               <p className="text-xs text-gray-400 mb-2">The base fee covers up to 2. Each property beyond 2 adds ₹100.</p>
//               <div className="flex items-center gap-3">
//                 <input
//                   type="number"
//                   min="0"
//                   value={houseProperties}
//                   onChange={(e) => setHouseProperties(parseInt(e.target.value) || 0)}
//                   className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
//                 />
//                 {documents.some(d => d.bill_as === 'houseProperty') && (
//                   <span className="text-xs text-gray-400">House-loan document detected — confirm the count.</span>
//                 )}
//               </div>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Residential status
//               </label>
//               <p className="text-xs text-gray-400 mb-2">Not visible from any document — set it here.</p>
//               <div className="space-y-2">
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="residentialStatus"
//                     value="resident"
//                     checked={residentialStatus === 'resident'}
//                     onChange={(e) => setResidentialStatus(e.target.value)}
//                     className="w-4 h-4 text-primary-500"
//                   />
//                   <span className="text-sm">Resident (no foreign income)</span>
//                 </label>
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="residentialStatus"
//                     value="nri"
//                     checked={residentialStatus === 'nri'}
//                     onChange={(e) => setResidentialStatus(e.target.value)}
//                     className="w-4 h-4 text-primary-500"
//                   />
//                   <span className="text-sm">Non-Resident Indian — adds ₹500</span>
//                 </label>
//                 <label className="flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="radio"
//                     name="residentialStatus"
//                     value="residentForeign"
//                     checked={residentialStatus === 'residentForeign'}
//                     onChange={(e) => setResidentialStatus(e.target.value)}
//                     className="w-4 h-4 text-primary-500"
//                   />
//                   <span className="text-sm">Resident with foreign income (DTAA / FTC / Form 67) — adds ₹750</span>
//                 </label>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Add a stream with no document uploaded
//               </label>
//               <p className="text-xs text-gray-400 mb-2">
//                 For income the client mentioned but didn't (or couldn't) give a file for.
//               </p>
//               <div className="space-y-2">
//                 {MISSED_OPTIONS.map(option => (
//                   <label key={option.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         checked={missedStreams.includes(option.id)}
//                         onChange={(e) => {
//                           if (e.target.checked) setMissedStreams([...missedStreams, option.id])
//                           else setMissedStreams(missedStreams.filter(id => id !== option.id))
//                         }}
//                         className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
//                       />
//                       <span className="text-sm">{option.label}</span>
//                     </div>
//                     <span className="text-sm font-medium text-gray-500">+₹{option.amount}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Send to CA */}
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//             <h3 className="font-semibold text-gray-900 mb-1">3 · Send to your CA</h3>
//             <p className="text-xs text-gray-400 mb-4">
//               Once you've added everything you have, send it across — your CA will see every document,
//               its detected type, and this estimated bill.
//             </p>
//             <div className="flex items-center justify-between gap-4 flex-wrap">
//               <div className="text-sm text-gray-600">
//                 <span className="font-medium text-gray-900">{documents.length}</span> document{documents.length === 1 ? '' : 's'} ·{' '}
//                 <span className="font-medium text-gray-900">₹{estimatedBill.total}</span> estimated
//               </div>
//               <div className="flex items-center gap-3">
//                 {sentToCA && sentToCAAt && (
//                   <span className="text-xs text-green-600 flex items-center gap-1">
//                     <CheckCircle className="w-3.5 h-3.5" />
//                     Sent {format(sentToCAAt, 'd MMM, h:mm a')}
//                   </span>
//                 )}
//                 <button
//                   className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                   onClick={handleSendToCA}
//                   disabled={sendingToCA || documents.length === 0 || isSendingRef.current}
//                 >
//                   {sendingToCA ? (
//                     <span className="flex items-center gap-2">
//                       <Loader2 className="w-4 h-4 animate-spin" /> 
//                       Sending...
//                     </span>
//                   ) : sentToCA ? (
//                     'Resend to CA'
//                   ) : (
//                     'Send to CA'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT: Fee Pamphlet, Estimated Bill & Computation Bill (4 columns) */}
//         <div className="lg:col-span-4 space-y-6">
//           {/* Fee Pamphlet - Clickable Logo Card */}
//           <div 
//             className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer hover:shadow-md ${
//               feeAccepted && !hasNewItems
//                 ? 'border-green-200 hover:border-green-300' 
//                 : feeAccepted && hasNewItems
//                 ? 'border-yellow-200 hover:border-yellow-300 animate-pulse'
//                 : 'border-gray-200 hover:border-primary-300'
//             }`}
//             onClick={() => setShowFeePamphletPopup(true)}
//           >
//             <div className="flex items-center justify-center flex-col py-4">
//               <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
//                 feeAccepted && !hasNewItems
//                   ? 'bg-gradient-to-br from-green-500 to-green-600' 
//                   : feeAccepted && hasNewItems
//                   ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
//                   : 'bg-gradient-to-br from-primary-500 to-primary-600'
//               }`}>
//                 {feeAccepted && !hasNewItems ? (
//                   <BadgeCheck className="w-10 h-10 text-white" />
//                 ) : feeAccepted && hasNewItems ? (
//                   <Sparkles className="w-10 h-10 text-white" />
//                 ) : (
//                   <Receipt className="w-10 h-10 text-white" />
//                 )}
//               </div>
//               <h3 className="font-semibold text-gray-900">Fee Pamphlet</h3>
              
//               {feeAccepted && !hasNewItems ? (
//                 <div className="mt-2 flex flex-col items-center">
//                   <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
//                     <CheckCircle className="w-3 h-3" />
//                     Accepted
//                   </span>
//                   <p className="text-xs text-gray-400 mt-1">Click to view your fee structure</p>
//                 </div>
//               ) : feeAccepted && hasNewItems ? (
//                 <div className="mt-2 flex flex-col items-center">
//                   <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
//                     <Sparkles className="w-3 h-3" />
//                     New Items Available
//                   </span>
//                   <p className="text-xs text-gray-400 mt-1">Click to review new fee categories</p>
//                 </div>
//               ) : feePamphlet ? (
//                 <div className="mt-2 flex flex-col items-center">
//                   <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1">
//                     <Clock className="w-3 h-3" />
//                     Pending Acceptance
//                   </span>
//                   <p className="text-xs text-gray-400 mt-1">Click to review and accept</p>
//                 </div>
//               ) : (
//                 <div className="mt-2 flex flex-col items-center">
//                   <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
//                     Not Published
//                   </span>
//                   <p className="text-xs text-gray-400 mt-1">Awaiting CA to publish</p>
//                 </div>
//               )}
              
//               {feePamphlet && feePamphlet.fee_data && (
//                 <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
//                   <span>{feePamphlet.fee_data.length} items</span>
//                   <span>•</span>
//                   <span>₹{parseFloat(feePamphlet.grand_total || 0).toFixed(0)}</span>
//                   {feePamphlet.version > 1 && (
//                     <>
//                       <span>•</span>
//                       <span>v{feePamphlet.version}</span>
//                     </>
//                   )}
//                 </div>
//               )}
//               {feePamphletLoading && (
//                 <Loader2 className="w-4 h-4 text-primary-500 animate-spin mt-2" />
//               )}
//             </div>
//           </div>

//           {/* Estimated Bill */}
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//                 <Receipt className="w-4 h-4 text-primary-500" />
//                 Estimated Bill
//               </h3>
//               <span className="text-xs text-gray-400">Indicative</span>
//             </div>

//             {estimatedBill.lines.length === 0 ? (
//               <div className="text-center py-8 text-gray-500">
//                 <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
//                 <p className="text-sm">Upload a document or add a stream to see the estimate.</p>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {estimatedBill.lines.map((line, idx) => (
//                   <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100">
//                     <div className="flex-1 pr-3">
//                       <p className="text-sm font-medium text-gray-800">{line.label}</p>
//                       <div className="flex items-center gap-2 mt-0.5">
//                         <span className={`text-[10px] px-2 py-0.5 rounded ${
//                           line.kind === 'base' ? 'bg-gray-100 text-gray-600' :
//                           line.kind === 'detected' ? 'bg-green-100 text-green-700' :
//                           'bg-yellow-100 text-yellow-700'
//                         }`}>
//                           {line.kind === 'base' ? 'base' : line.kind}
//                         </span>
//                         {line.src && (
//                           <span className="text-xs text-gray-400">
//                             · {line.src === 'manual' ? 'added manually' : line.src}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-900">₹{line.amount}</span>
//                   </div>
//                 ))}

//                 <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
//                   <span className="text-base font-bold text-gray-900">Total estimate</span>
//                   <span className="text-2xl font-bold text-primary-600">₹{estimatedBill.total}</span>
//                 </div>

//                 <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                   <p className="text-xs text-gray-500">
//                     Indicative estimate based on the documents and inputs above. Final fee is confirmed after computation of income; if actual volume or effort is higher than reasonable estimates, we will take prior approval before revising.
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-3 mt-3">
//                   <button
//                     className="btn-primary text-sm px-4 py-2"
//                     onClick={() => {
//                       const summary = estimatedBill.lines.map(l =>
//                         `${l.label}: ₹${l.amount}${l.reason ? ` (${l.reason})` : ''}`
//                       ).join('\n')
//                       const totalText = `Total: ₹${estimatedBill.total}`
//                       navigator.clipboard.writeText([...summary.split('\n'), totalText].join('\n'))
//                       safeToast.success('Summary copied to clipboard')
//                     }}
//                   >
//                     Copy summary
//                   </button>
//                   <button
//                     className="btn-outline text-sm px-4 py-2"
//                     onClick={() => {
//                       setDocuments([])
//                       setHouseProperties(0)
//                       setResidentialStatus('resident')
//                       setMissedStreams([])
//                       safeToast.success('Cleared all')
//                     }}
//                   >
//                     Clear all
//                   </button>
//                 </div>

//                 <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
//                   <Shield className="w-3 h-3" />
//                   Files are read locally in this browser before upload.
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Computation Bill - shown when CA has sent one */}
//           {computationBillLoading ? (
//             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//               <div className="flex items-center justify-center py-4">
//                 <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
//                 <span className="ml-2 text-sm text-gray-500">Loading computation bill...</span>
//               </div>
//             </div>
//           ) : computationBill && (
//             (computationBill.status === 'SENT_TO_CLIENT' || 
//              computationBill.status === 'SENT' || 
//              computationBill.status === 'CONFIRMED_BY_CLIENT' || 
//              computationBill.status === 'CONFIRMED') ? (
//               <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
//                 (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') 
//                   ? 'border-green-200' 
//                   : 'border-primary-200'
//               }`}>
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//                     <FileCheck className={`w-4 h-4 ${
//                       (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') 
//                         ? 'text-green-500' 
//                         : 'text-primary-500'
//                     }`} />
//                     Computation Bill
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {getComputationBillStatusBadge(computationBill.status)}
//                     {computationBill.submission_status === 'CONFIRMED' && (
//                       <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//                         Submission Confirmed
//                       </span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
//                   {computationBill.fee_components && computationBill.fee_components.length > 0 ? (
//                     computationBill.fee_components.map((item, idx) => (
//                       <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100">
//                         <div className="flex-1 pr-3">
//                           <p className="text-sm font-medium text-gray-800">{item.label || item.description || 'Fee Component'}</p>
//                           <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                             <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
//                               {item.category || 'Fee'}
//                             </span>
//                             {item.document_name && (
//                               <span className="text-xs text-gray-400">· {item.document_name}</span>
//                             )}
//                             {item.is_base && (
//                               <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">Base</span>
//                             )}
//                             {item.is_extra && (
//                               <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Extra</span>
//                             )}
//                           </div>
//                         </div>
//                         <span className="text-sm font-semibold text-gray-900">₹{item.amount || 0}</span>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-4 text-gray-500">
//                       <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
//                       <p className="text-sm">No fee components found</p>
//                     </div>
//                   )}

//                   <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
//                     <span className="text-base font-bold text-gray-900">Total</span>
//                     <span className="text-2xl font-bold text-primary-600">
//                       ₹{computationBill.total || 0}
//                     </span>
//                   </div>

//                   {computationBill.notes && (
//                     <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
//                       <p className="text-xs text-blue-700">{computationBill.notes}</p>
//                     </div>
//                   )}

//                   <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                     <p className="text-xs text-gray-500">
//                       The CA has prepared this computation bill based on your documents and the fee structure.
//                       Please review the details carefully before proceeding.
//                     </p>
//                   </div>

//                   {(computationBill.status === 'SENT_TO_CLIENT' || computationBill.status === 'SENT') && (
//                     <div className="flex items-center gap-3 mt-4">
//                       <button
//                         className="btn-primary text-sm px-6 py-2.5 flex-1 disabled:opacity-50"
//                         onClick={handleConfirmAndProceed}
//                         disabled={confirmingBill || proceedingToCA}
//                       >
//                         {confirmingBill ? (
//                           <span className="flex items-center justify-center gap-2">
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             Confirming...
//                           </span>
//                         ) : proceedingToCA ? (
//                           <span className="flex items-center justify-center gap-2">
//                             <Loader2 className="w-4 h-4 animate-spin" />
//                             Processing...
//                           </span>
//                         ) : (
//                           '✅ Confirm & Proceed'
//                         )}
//                       </button>
//                       <button
//                         className="btn-outline text-sm px-4 py-2.5 text-red-600 border-red-300 hover:bg-red-50"
//                         onClick={handleCancelComputationBill}
//                         disabled={cancellingBill}
//                       >
//                         {cancellingBill ? (
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                         ) : (
//                           'Cancel'
//                         )}
//                       </button>
//                     </div>
//                   )}

//                   {(computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') && (
//                     <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//                       <div className="flex items-center gap-2">
//                         <CheckCircle className="w-4 h-4 text-green-600" />
//                         <p className="text-sm text-green-700 font-medium">
//                           ✅ You have confirmed this computation bill. It has been sent to your CA for final processing.
//                         </p>
//                       </div>
//                       {computationBill.confirmed_at && (
//                         <p className="text-xs text-green-600 mt-1">
//                           Confirmed on {format(new Date(computationBill.confirmed_at), 'd MMM yyyy, h:mm a')}
//                         </p>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : null
//           )}
//         </div>
//       </div>

//       {/* Fee Pamphlet Popup - View Only (triggered by clicking the logo) */}
//       <FeePamplatePopup 
//         isOpen={showFeePamphletPopup} 
//         onAccept={() => {
//           setShowFeePamphletPopup(false)
//           fetchClientData()
//         }}
//         isViewOnly={true}
//         initialData={pamplateData}
//         statusData={feeStatus}
//       />
//     </DashboardLayout>
//   )
// }

// export default ClientDashboard

// src/pages/client/ClientDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import {
  FileText, Upload, X, Loader2, CheckCircle, Clock, AlertCircle,
  Receipt, User, Mail, Building2, Trash2, Edit, ArrowUpRight,
  ArrowDownRight, DollarSign, Calendar, FileCheck, Download, Eye,
  Settings, LogOut, Menu, ChevronDown, ChevronRight, Search,
  Filter, Grid, List, Printer, Copy, Check, AlertTriangle, Info,
  Star, Shield, Lock, RefreshCw, ClipboardList, BookOpen, Home,
  Building, TrendingUp, Globe, Users, Briefcase, Folder, FolderOpen,
  MessageSquare, Bell, HelpCircle, Paperclip, CreditCard, Banknote,
  Share2, Maximize2, Minimize2, ChevronLeft, Zap, Award, Sparkles,
  BadgeCheck, ArrowRight, Calendar as CalendarIcon, Filter as FilterIcon
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast.js'
import { format } from 'date-fns'
import FeePamplatePopup from './FeePamplatePopup.jsx'
import { feeApi } from '../../api/fee.api.js'

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
  base: { label: 'Basic ITR Fee (Salary/House Property/Other Sources)', amount: 500 },
  hpExtra: { label: 'Each House Property beyond 2', amount: 100 },
  cgImmovable: { label: 'Capital Gains - Immovable Property', amount: 200 },
  cgEquity: { label: 'Capital Gains - Equity/Debt/Mutual Funds', amount: 300 },
  cgOther: { label: 'Capital Gains - Other (incl. F&O)', amount: 300 },
  bizPresumptive: { label: 'Business Income - Without Accounts', amount: 500 },
  bizAccounts: { label: 'Business Income - With Accounts', amount: 700 },
  nri: { label: 'Non-Resident Indian (NRI)', amount: 500 },
  residentForeign: { label: 'Resident with Foreign Income', amount: 750 }
}

// ============ BILL AS OPTIONS ============
const BILL_AS_OPTIONS = [
  { value: 'ignore', label: '— Ignore this file —' },
  { value: 'salary', label: 'Salary (in base fee)', base: true },
  { value: 'houseProperty', label: 'House Property (in base fee)', base: true },
  { value: 'ifos', label: 'Other Sources (in base fee)', base: true },
  { value: 'cgEquity', label: 'Capital Gains - Equity/Debt/MF', component: 'cgEquity' },
  { value: 'cgImmovable', label: 'Capital Gains - Immovable', component: 'cgImmovable' },
  { value: 'cgOther', label: 'Capital Gains - Other/F&O', component: 'cgOther' },
  { value: 'bizPresumptive', label: 'Business - Without Financials', component: 'bizPresumptive' },
  { value: 'bizAccounts', label: 'Business - With Financials', component: 'bizAccounts' }
]

// ============ MISSED STREAMS OPTIONS ============
const MISSED_OPTIONS = [
  { id: 'cgImmovable', label: 'Capital Gains - Immovable Property', amount: 200 },
  { id: 'cgEquity', label: 'Capital Gains - Equity/Debt/MF', amount: 300 },
  { id: 'cgOther', label: 'Capital Gains - Other/F&O', amount: 300 },
  { id: 'bizPresumptive', label: 'Business - Without Financials', amount: 500 },
  { id: 'bizAccounts', label: 'Business - With Financials', amount: 700 }
]

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
    note: 'House Property — included in base fee. Set the number of properties below.'
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
const norm = (t) => (' ' + t + ' ').toLowerCase().replace(/\s+/g, ' ')

function classifyDocument(text) {
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

  if (!okMatches.length) return { status: 'unrecognized', nearMisses }

  const best = okMatches[0]
  const confidence = best.supCount >= best.def.minSupporting + 1 ? 'high' : 'medium'

  return {
    status: best.def.special === 'review' ? 'comprehensive' : 'recognized',
    def: best.def,
    evidence: best.evidence,
    confidence,
    nearMisses
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

async function extractPdfText(file, password) {
  if (!window.pdfjsLib) {
    throw { code: 'lib_missing', message: 'PDF reader library not loaded yet.' }
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

async function extractExcelText(file) {
  if (!window.XLSX) {
    throw { code: 'lib_missing', message: 'Excel reader library not loaded yet.' }
  }
  const buf = await file.arrayBuffer()
  const wb = window.XLSX.read(new Uint8Array(buf), { type: 'array' })
  return wb.SheetNames.map(n => window.XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n')
}

async function extractAndClassify(file, password) {
  const ext = file.name.split('.').pop().toLowerCase()
  const out = { extractionStatus: 'processing', detected: null, billAs: 'ignore' }
  try {
    let text = ''
    if (ext === 'pdf') text = await extractPdfText(file, password)
    else if (['xlsx', 'xls'].includes(ext)) text = await extractExcelText(file)
    else { out.extractionStatus = 'unsupported'; return out }

    out.rawTextLength = text ? text.replace(/\s+/g, '').length : 0
    out.rawTextPreview = text ? text.trim().slice(0, 500) : ''

    if (!text || out.rawTextLength < SETTINGS.minTextChars) {
      out.extractionStatus = 'scanned'
      return out
    }

    const result = classifyDocument(norm(text))
    out.detected = result
    out.extractionStatus = result.status
    out.billAs = result.def ? (result.def.special ? 'ignore' : result.def.billAs) : 'ignore'
    return out
  } catch (err) {
    if (err && err.code === 'password') {
      out.extractionStatus = 'password'
      out.needPwd = true
    } else {
      out.extractionStatus = 'error'
      out.errMsg = (err && err.message) || 'Could not read this file.'
    }
    return out
  }
}

const EXTRACTION_META = {
  processing: { cls: 'neutral', text: 'Reading…' },
  recognized: { cls: 'ok', text: null },
  comprehensive: { cls: 'review', text: 'Comprehensive statement' },
  unrecognized: { cls: 'review', text: 'Not recognised — choose how to bill it' },
  scanned: { cls: 'bad', text: 'Scanned / image PDF — text not extractable' },
  password: { cls: 'bad', text: 'Password-protected' },
  unsupported: { cls: 'bad', text: 'Unsupported file type' },
  error: { cls: 'bad', text: "Couldn't read this file" }
}

const ClientDashboard = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [allDocuments, setAllDocuments] = useState([]) // All documents grouped by year
  const [documents, setDocuments] = useState([]) // Documents for selected year
  const [feePamphlet, setFeePamphlet] = useState(null)
  const [bills, setBills] = useState([])
  const [clientData, setClientData] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // ✅ Year-specific adjustments
  const [yearAdjustments, setYearAdjustments] = useState({})
  const [houseProperties, setHouseProperties] = useState(0)
  const [residentialStatus, setResidentialStatus] = useState('resident')
  const [missedStreams, setMissedStreams] = useState([])
  const [estimatedBill, setEstimatedBill] = useState({ lines: [], total: 0 })
  
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const [processingFiles, setProcessingFiles] = useState({})
  const [feePamphletLoading, setFeePamphletLoading] = useState(true)
  const [libsReady, setLibsReady] = useState(false)
  const [libsError, setLibsError] = useState(null)
  const [debugOpenIds, setDebugOpenIds] = useState(new Set())
  const [sendingToCA, setSendingToCA] = useState(false)
  const [sentToCA, setSentToCA] = useState(false)
  const [sentToCAAt, setSentToCAAt] = useState(null)

  // ✅ Financial Year State
  const [financialYears, setFinancialYears] = useState([])
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('')
  const [isFinancialYearLoading, setIsFinancialYearLoading] = useState(true)

  // ✅ Ref to prevent double submission
  const isSendingRef = useRef(false)

  // Fee pamphlet popup states
  const [showFeePopup, setShowFeePopup] = useState(false)
  const [checkingFeeStatus, setCheckingFeeStatus] = useState(true)
  const [feeAccepted, setFeeAccepted] = useState(false)
  const [hasCheckedFee, setHasCheckedFee] = useState(false)
  const [feeStatus, setFeeStatus] = useState(null)
  const [pamplateData, setPamplateData] = useState(null)
  const [hasNewItems, setHasNewItems] = useState(false)
  const [showFeePamphletPopup, setShowFeePamphletPopup] = useState(false)

  // Computation Bill states
  const [computationBill, setComputationBill] = useState(null)
  const [computationBillLoading, setComputationBillLoading] = useState(false)
  const [proceedingToCA, setProceedingToCA] = useState(false)
  const [cancellingBill, setCancellingBill] = useState(false)
  const [confirmingBill, setConfirmingBill] = useState(false)

  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    approvedDocuments: 0,
    totalBills: 0,
    pendingBills: 0,
    totalAmount: 0
  })

  // Load extraction libs on mount
  useEffect(() => {
    let cancelled = false
    loadExtractionLibs()
      .then(() => { if (!cancelled) setLibsReady(true) })
      .catch(err => { if (!cancelled) setLibsError(err.message || 'Failed to load file-reading libraries.') })
    return () => { cancelled = true }
  }, [])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await fetchClientData()
      await fetchFinancialYears()
    }
    loadData()
  }, [])

  // ✅ Update documents when financial year changes
  useEffect(() => {
    if (selectedFinancialYear && allDocuments.length > 0) {
      // Filter documents by selected financial year
      const yearDocs = allDocuments.filter(doc => doc.fy_year === selectedFinancialYear)
      setDocuments(yearDocs)
      
      // Load adjustments for this year
      const adjustments = yearAdjustments[selectedFinancialYear] || {
        houseProperties: 0,
        residentialStatus: 'resident',
        missedStreams: []
      }
      setHouseProperties(adjustments.houseProperties || 0)
      setResidentialStatus(adjustments.residentialStatus || 'resident')
      setMissedStreams(adjustments.missedStreams || [])
    } else {
      setDocuments([])
    }
  }, [selectedFinancialYear, allDocuments])

  // ✅ Save adjustments when they change
  useEffect(() => {
    if (selectedFinancialYear) {
      setYearAdjustments(prev => ({
        ...prev,
        [selectedFinancialYear]: {
          houseProperties,
          residentialStatus,
          missedStreams
        }
      }))
    }
  }, [houseProperties, residentialStatus, missedStreams, selectedFinancialYear])

  useEffect(() => {
    computeEstimate()
  }, [documents, houseProperties, residentialStatus, missedStreams, selectedFinancialYear])

  // Fetch computation bill on mount and when submissions change
  useEffect(() => {
    fetchComputationBill()
  }, [])

  // ============ FETCH FINANCIAL YEARS ============
  const fetchFinancialYears = async () => {
    setIsFinancialYearLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await axios.get(`${API_URL}/financial-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setFinancialYears(response.data || [])
      
      if (response.data && response.data.length > 0) {
        const currentYear = response.data.find(fy => fy.status === true)
        if (currentYear) {
          setSelectedFinancialYear(currentYear.year)
        } else {
          setSelectedFinancialYear(response.data[0].year)
        }
      }
    } catch (error) {
      console.error('Error fetching financial years:', error)
      const defaultYears = [
        { id: 1, year: '2023-24', status: false },
        { id: 2, year: '2024-25', status: true },
        { id: 3, year: '2025-26', status: false },
        { id: 4, year: '2026-27', status: false }
      ]
      setFinancialYears(defaultYears)
      setSelectedFinancialYear('2024-25')
    } finally {
      setIsFinancialYearLoading(false)
    }
  }

  // ============ FEE PAMPHLET STATUS CHECK ============
  const checkFeePamphletStatus = async () => {
    setCheckingFeeStatus(true)
    try {
      const status = await feeApi.getMyPamplateStatus()
      setFeeStatus(status)
      
      console.log('📋 Fee Pamphlet Status:', status)
      
      if (!status.has_pamplate) {
        console.log('📋 No fee pamphlet found')
        setFeeAccepted(false)
        setShowFeePopup(false)
        setPamplateData(null)
        setCheckingFeeStatus(false)
        return
      }
      
      if (status.has_accepted) {
        console.log('✅ Fee pamphlet already accepted')
        setFeeAccepted(true)
        setShowFeePopup(false)
        setHasNewItems(false)
        setHasCheckedFee(true)
        setCheckingFeeStatus(false)
        return
      }
      
      if (status.has_rejected) {
        console.log('❌ Fee pamphlet rejected')
        setFeeAccepted(false)
        setShowFeePopup(false)
        setHasCheckedFee(true)
        setCheckingFeeStatus(false)
        return
      }
      
      console.log('📋 Fee pamphlet needs acceptance - showing popup')
      
      try {
        const data = await feeApi.getMyPamplate()
        setPamplateData(data)
        
        if (data.previous_accepted_fee_ids && data.fee_data) {
          const newItems = data.fee_data.filter(
            item => !data.previous_accepted_fee_ids.includes(item.id)
          )
          if (newItems.length > 0) {
            setHasNewItems(true)
            console.log(`📋 ${newItems.length} new fee items added`)
          }
        }
      } catch (err) {
        console.error('Error fetching pamphlet data:', err)
      }
      
      setFeeAccepted(false)
      setShowFeePopup(true)
      setHasCheckedFee(true)
      setCheckingFeeStatus(false)
      
    } catch (error) {
      console.error('Error checking fee pamphlet status:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        navigate('/login')
      }
      setHasCheckedFee(true)
      setCheckingFeeStatus(false)
    }
  }

  // ============ HANDLE FEE ACCEPTANCE ============
  const handleFeeAcceptance = () => {
    console.log('✅ Fee pamphlet accepted!')
    setFeeAccepted(true)
    setShowFeePopup(false)
    setHasCheckedFee(true)
    setHasNewItems(false)
    
    safeToast.success('Fee pamphlet accepted! You can now access your dashboard.')
    
    setTimeout(() => {
      fetchClientData()
    }, 500)
  }

  // ============ FETCH COMPUTATION BILL ============
  const fetchComputationBill = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      let submissionsRes
      try {
        submissionsRes = await axios.get(`${API_URL}/submissions/client/my-submissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (err) {
        if (err.response?.status === 404) {
          setComputationBill(null)
          setComputationBillLoading(false)
          return
        }
        throw err
      }
      
      const submissions = submissionsRes.data || []
      if (submissions.length === 0) {
        setComputationBill(null)
        setComputationBillLoading(false)
        return
      }
      
      const sortedSubmissions = [...submissions].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      
      const priorityStatuses = ['BILL_SENT', 'BILL_CONFIRMED', 'CONFIRMED', 'BILL_GENERATED']
      const prioritySubs = sortedSubmissions.filter(s => 
        priorityStatuses.includes(s.status)
      )
      
      const allSubsToCheck = [...prioritySubs, ...sortedSubmissions]
      
      for (const sub of allSubsToCheck) {
        try {
          const billRes = await axios.get(`${API_URL}/submissions/${sub.id}/computation-bill`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (billRes.data.has_bill && billRes.data.bill_data) {
            const billStatus = billRes.data.status || 'DRAFT'
            if (billStatus === 'SENT_TO_CLIENT' || 
                billStatus === 'SENT' || 
                billStatus === 'CONFIRMED_BY_CLIENT' || 
                billStatus === 'CONFIRMED') {
              setComputationBill({
                ...billRes.data.bill_data,
                status: billStatus,
                submission_id: sub.id,
                submission_status: sub.status
              })
              setComputationBillLoading(false)
              return
            }
          }
        } catch (billErr) {
          continue
        }
      }
      
      setComputationBill(null)
    } catch (error) {
      console.error('Error fetching computation bill:', error)
      setComputationBill(null)
    } finally {
      setComputationBillLoading(false)
    }
  }, [])

  // ============ FETCH DATA ============
  const fetchClientData = async () => {
    setIsLoading(true)
    setFeePamphletLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

      const profileRes = await axios.get(`${API_URL}/client/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setClientData(profileRes.data)

      const docsRes = await axios.get(`${API_URL}/client/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // ✅ Store all documents with their financial year
      const docsWithYear = (docsRes.data || []).map(doc => ({
        ...doc,
        detected: null,
        extractionStatus: doc.bill_as ? 'recognized' : undefined,
        bill_as: doc.bill_as || 'ignore',
        fy_year: doc.fy_year || '2024-25' // Default if not set
      }))

      setAllDocuments(docsWithYear)

      try {
        const feeRes = await axios.get(`${API_URL}/fees/my-pamplate`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        setFeePamphlet(feeRes.data)
        setPamplateData(feeRes.data)
        
        if (feeRes.data.accepted_at) {
          setFeeAccepted(true)
          setShowFeePopup(false)
          setHasCheckedFee(true)
          setCheckingFeeStatus(false)
        }
      } catch (err) {
        setFeePamphlet(null)
        setPamplateData(null)
      } finally {
        setFeePamphletLoading(false)
      }

      let billsData = []
      try {
        const billsRes = await axios.get(`${API_URL}/bills/client/my-bills`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        billsData = billsRes.data || []
        setBills(billsData)
      } catch (err) {
        setBills([])
      }

      const docs = docsRes.data || []
      setStats({
        totalDocuments: docs.length,
        pendingDocuments: docs.filter(d => {
          const status = (d.status || '').toLowerCase()
          return status === 'pending_upload' || status === 'uploaded'
        }).length,
        approvedDocuments: docs.filter(d => (d.status || '').toLowerCase() === 'approved').length,
        totalBills: billsData.length,
        pendingBills: billsData.filter(b => b.status === 'pending').length,
        totalAmount: billsData.reduce((sum, b) => sum + parseFloat(b.grand_total || 0), 0)
      })

      await checkFeePamphletStatus()
      await fetchComputationBill()

    } catch (error) {
      console.error('Error fetching client data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        navigate('/login')
      } else {
        safeToast.error('Failed to load dashboard data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ============ COMPUTE ESTIMATE - YEAR SPECIFIC ============
  const computeEstimate = () => {
    const componentSource = {}
    let base = false

    // ✅ Process documents for the selected financial year
    documents.forEach(doc => {
      const billAs = doc.bill_as || 'ignore'
      const option = BILL_AS_OPTIONS.find(o => o.value === billAs)
      if (!option) return
      if (option.base) base = true
      if (option.component && !componentSource[option.component]) {
        componentSource[option.component] = doc.file_title || doc.document_type
      }
      if (option.component) base = true
    })

    // ✅ Process missed streams for the selected year
    missedStreams.forEach(id => {
      if (!componentSource[id]) componentSource[id] = '__manual__'
      base = true
    })

    const propCount = Math.max(0, parseInt(houseProperties) || 0)
    if (propCount > 0) base = true

    const lines = []
    
    if (base) {
      lines.push({ 
        kind: 'base', 
        label: FEE_SCHEDULE.base.label, 
        reason: 'Base fee for the return', 
        amount: FEE_SCHEDULE.base.amount 
      })
    }

    const extra = Math.max(0, propCount - 2)
    if (extra > 0) {
      lines.push({
        kind: 'detected',
        label: `House properties beyond 2 (${extra} × ₹${FEE_SCHEDULE.hpExtra.amount})`,
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
          reason: fromFile ? `Detected from: ${componentSource[k]}` : 'Added manually',
          src: fromFile ? componentSource[k] : 'manual',
          amount: FEE_SCHEDULE[k].amount
        })
      }
    })

    if (residentialStatus === 'nri') {
      lines.push({ 
        kind: 'manual', 
        label: FEE_SCHEDULE.nri.label, 
        reason: 'Residential status: NRI', 
        src: 'manual', 
        amount: FEE_SCHEDULE.nri.amount 
      })
    }
    if (residentialStatus === 'residentForeign') {
      lines.push({ 
        kind: 'manual', 
        label: FEE_SCHEDULE.residentForeign.label, 
        reason: 'Residential status: Resident with Foreign Income', 
        src: 'manual', 
        amount: FEE_SCHEDULE.residentForeign.amount 
      })
    }

    const total = lines.reduce((s, l) => s + l.amount, 0)
    setEstimatedBill({ lines, total })
  }

  // ============ FILE HANDLING ============
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileSelect = (e) => {
    handleFiles(Array.from(e.target.files))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFiles = async (files) => {
    if (!libsReady) {
      safeToast.error(libsError ? `File reader unavailable: ${libsError}` : 'File reader is still loading — try again in a second.')
      return
    }
    for (const file of files) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop().toLowerCase()
    const isPdf = fileExt === 'pdf'
    const isExcel = ['xlsx', 'xls'].includes(fileExt)

    if (!isPdf && !isExcel) {
      safeToast.error(`${file.name} - Unsupported file type. Please upload PDF or Excel.`)
      return
    }

    if (!selectedFinancialYear) {
      safeToast.warning('Please select a financial year first.')
      return
    }

    setUploading(true)
    setProcessingFiles(prev => ({ ...prev, [file.name]: true }))

    const extraction = await extractAndClassify(file)

    if (extraction.extractionStatus === 'recognized' && extraction.detected) {
      safeToast.success(`Detected: ${extraction.detected.def.label} (${extraction.detected.confidence} confidence)`)
    } else if (extraction.extractionStatus === 'unrecognized') {
      safeToast.info('Document type not recognized from its contents — please select "Bill as" manually.')
    } else if (extraction.extractionStatus === 'comprehensive') {
      safeToast.info('Comprehensive statement (AIS/26AS) detected — review and select manually.')
    } else if (extraction.extractionStatus === 'scanned') {
      safeToast.warning(`${file.name} looks like a scanned/image file — no extractable text, so it can't be auto-classified.`)
    } else if (extraction.extractionStatus === 'error') {
      safeToast.error(`Couldn't read ${file.name}: ${extraction.errMsg}`)
    }

    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', fileExt.toUpperCase())
      formData.append('file_title', file.name)
      formData.append('bill_as', extraction.billAs)
      formData.append('fy_year', selectedFinancialYear) // ✅ Add financial year
      if (extraction.detected?.def?.label) {
        formData.append('detected_label', extraction.detected.def.label)
      }

      const response = await axios.post(
        `${API_URL}/client/upload-document`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      )

      const newDoc = {
        ...response.data,
        detected: extraction.detected,
        extractionStatus: extraction.extractionStatus,
        rawTextLength: extraction.rawTextLength,
        rawTextPreview: extraction.rawTextPreview,
        bill_as: response.data?.bill_as || extraction.billAs,
        fy_year: selectedFinancialYear
      }

      // ✅ Add to all documents
      setAllDocuments(prev => [...prev, newDoc])
      setSentToCA(false)
      safeToast.success(`Uploaded: ${file.name}`)
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload'
      safeToast.error(`Failed to upload ${file.name}: ${errorMsg}`)
    } finally {
      setUploading(false)
      setProcessingFiles(prev => ({ ...prev, [file.name]: false }))
    }
  }

  const handleBillAsChange = (docId, value) => {
    setDocuments(prev =>
      prev.map(doc => doc.id === docId ? { ...doc, bill_as: value } : doc)
    )
    // Also update in allDocuments
    setAllDocuments(prev =>
      prev.map(doc => doc.id === docId ? { ...doc, bill_as: value } : doc)
    )
  }

  const handleRemoveDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return
    
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.delete(`${API_URL}/client/documents/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setDocuments(prev => prev.filter(doc => doc.id !== docId))
      setAllDocuments(prev => prev.filter(doc => doc.id !== docId))
      safeToast.success('Document removed successfully')
      fetchClientData()
    } catch (error) {
      console.error('Error removing document:', error)
      if (error.response?.status === 403) {
        safeToast.error('You don\'t have permission to delete this document')
      } else if (error.response?.status === 404) {
        safeToast.error('Document not found')
      } else {
        safeToast.error('Failed to remove document')
      }
    }
  }

  // ============ SEND TO CA ============
  const handleSendToCA = async () => {
    if (isSendingRef.current) {
      console.log('⏳ Submission already in progress, skipping duplicate request')
      return
    }

    if (documents.length === 0) {
      safeToast.warning('Add at least one document before sending to your CA.')
      return
    }

    if (!selectedFinancialYear) {
      safeToast.warning('Please select a financial year first.')
      return
    }

    if (sentToCA) {
      const confirmSend = window.confirm(
        'You have already sent this estimate to your CA. Do you want to send it again?'
      )
      if (!confirmSend) return
    }

    isSendingRef.current = true
    setSendingToCA(true)
    
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

      const payload = {
        document_ids: documents.map(doc => doc.id),
        financial_year: selectedFinancialYear,
        adjustments: {
          house_properties: Math.max(0, parseInt(houseProperties) || 0),
          residential_status: residentialStatus,
          missed_streams: missedStreams
        },
        estimated_bill: {
          lines: estimatedBill.lines.map(l => ({
            label: l.label,
            amount: l.amount,
            kind: l.kind,
            source: l.src || null
          })),
          total: estimatedBill.total
        }
      }

      console.log('📤 Sending to CA...', { 
        documentCount: documents.length,
        totalEstimate: estimatedBill.total,
        financialYear: selectedFinancialYear,
        adjustments: payload.adjustments
      })

      const response = await axios.post(`${API_URL}/client/send-to-ca`, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ Send to CA response:', response.data)

      setSentToCA(true)
      setSentToCAAt(new Date())
      
      let successMsg = `✅ Sent to your CA for review! (${response.data.document_count} documents)`
      if (response.data.onedrive_uploaded) {
        successMsg += ' 📁 Files uploaded to OneDrive'
      } else if (response.data.onedrive_error) {
        successMsg += ` ⚠️ OneDrive upload: ${response.data.onedrive_error}`
      }
      
      safeToast.success(successMsg)
      safeToast.info(`📋 Submission #${response.data.submission_id} created`)
      
      if (response.data.onedrive_folder_url) {
        safeToast.info('📁 Documents available in OneDrive folder')
      }
      
      await fetchClientData()
      
    } catch (error) {
      console.error('❌ Error sending to CA:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to send to CA'
      safeToast.error(errorMsg)
    } finally {
      isSendingRef.current = false
      setSendingToCA(false)
    }
  }

  // ============ HANDLE CONFIRM & PROCEED TO CA ============
  const handleConfirmAndProceed = async () => {
    if (!computationBill?.submission_id) {
      safeToast.error('No submission found')
      return
    }
    
    if (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') {
      safeToast.info('This bill has already been confirmed')
      return
    }
    
    setConfirmingBill(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const confirmResponse = await axios.post(
        `${API_URL}/submissions/${computationBill.submission_id}/computation-bill/confirm`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (confirmResponse.data) {
        safeToast.success('✅ Bill confirmed!')
        
        setConfirmingBill(false)
        setProceedingToCA(true)
        
        const proceedResponse = await axios.post(
          `${API_URL}/submissions/${computationBill.submission_id}/proceed`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        
        safeToast.success('✅ Submitted to CA successfully!')
        setComputationBill(prev => ({
          ...prev,
          status: 'CONFIRMED_BY_CLIENT',
          confirmed_at: new Date().toISOString()
        }))
        
        await fetchClientData()
      }
      
    } catch (error) {
      console.error('Error confirming and proceeding:', error)
      
      if (error.response?.data?.detail?.includes('already confirmed')) {
        try {
          const token = localStorage.getItem('access_token')
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
          
          setConfirmingBill(false)
          setProceedingToCA(true)
          
          const proceedResponse = await axios.post(
            `${API_URL}/submissions/${computationBill.submission_id}/proceed`,
            {},
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          
          safeToast.success('✅ Submitted to CA successfully!')
          setComputationBill(prev => ({
            ...prev,
            status: 'CONFIRMED_BY_CLIENT',
            confirmed_at: new Date().toISOString()
          }))
          
          await fetchClientData()
          return
        } catch (proceedErr) {
          console.error('Error proceeding after confirmation:', proceedErr)
        }
      }
      
      const errorMsg = error.response?.data?.detail || 'Failed to proceed'
      safeToast.error(errorMsg)
    } finally {
      setConfirmingBill(false)
      setProceedingToCA(false)
    }
  }

  // ============ HANDLE CANCEL COMPUTATION BILL ============
  const handleCancelComputationBill = async () => {
    if (!window.confirm('Are you sure you want to cancel this computation bill? Your CA will be notified.')) {
      return
    }
    
    setCancellingBill(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.post(
        `${API_URL}/submissions/${computationBill.submission_id}/cancel`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      safeToast.info('Computation bill cancelled. Your CA has been notified.')
      setComputationBill(null)
      await fetchClientData()
      
    } catch (error) {
      console.error('Error cancelling computation bill:', error)
      safeToast.error('Failed to cancel computation bill')
    } finally {
      setCancellingBill(false)
    }
  }

  // ============ TOGGLE DEBUG ============
  const toggleDebug = (id) => {
    setDebugOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ============ STATUS BADGE ============
  const getStatusBadge = (status) => {
    const normalizedStatus = (status || '').toLowerCase()
    const statusMap = {
      'pending_upload': { label: 'Pending Upload', color: 'bg-yellow-100 text-yellow-700' },
      'uploaded': { label: 'Uploaded', color: 'bg-blue-100 text-blue-700' },
      'approved': { label: 'Approved', color: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700' },
      're_upload_required': { label: 'Re-upload Required', color: 'bg-orange-100 text-orange-700' }
    }
    const config = statusMap[normalizedStatus] || statusMap['pending_upload']
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
  }

  // ============ CLASSIFICATION BADGE ============
  const getClassificationBadge = (doc) => {
    if (doc.extractionStatus === 'comprehensive') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Comprehensive statement</span>
    }
    if (doc.extractionStatus === 'recognized' && doc.detected) {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          ✓ {doc.detected.def.label} · {doc.detected.confidence} confidence
        </span>
      )
    }
    if (doc.extractionStatus === 'unrecognized') {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ Not recognised — choose manually</span>
    }
    if (['scanned', 'password', 'unsupported', 'error'].includes(doc.extractionStatus)) {
      const meta = EXTRACTION_META[doc.extractionStatus]
      return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{meta.text}</span>
    }
    return null
  }

  // ============ COMPUTATION BILL STATUS BADGE ============
  const getComputationBillStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
      'SENT_TO_CLIENT': { label: 'Sent to You', color: 'bg-blue-100 text-blue-700' },
      'SENT': { label: 'Sent to You', color: 'bg-blue-100 text-blue-700' },
      'CONFIRMED_BY_CLIENT': { label: 'Confirmed ✓', color: 'bg-green-100 text-green-700' },
      'CONFIRMED': { label: 'Confirmed ✓', color: 'bg-green-100 text-green-700' },
      'CANCELLED_BY_CLIENT': { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
      'FINALIZED': { label: 'Finalized', color: 'bg-purple-100 text-purple-700' }
    }
    const config = statusMap[status] || statusMap['DRAFT']
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
  }

  // ============ LOADING STATE ============
  if (isLoading || checkingFeeStatus) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  // ============ SHOW POPUP WHEN FEE NOT ACCEPTED ============
  if (!feeAccepted && showFeePopup) {
    return (
      <>
        <DashboardLayout title="Dashboard" subtitle="Review fee pamphlet">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-4" />
              <p className="text-gray-500">Please review the fee pamphlet to continue...</p>
            </div>
          </div>
        </DashboardLayout>
        <FeePamplatePopup 
          isOpen={showFeePopup} 
          onAccept={handleFeeAcceptance}
          isViewOnly={false}
          initialData={pamplateData}
          statusData={feeStatus}
        />
      </>
    )
  }

  // ============ MAIN RENDER ============
  return (
    <DashboardLayout
      title="ITR Fee Estimator"
      subtitle="Drop your documents and the estimate builds itself"
    >
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

      {/* ✅ Financial Year Selector - Shows active year */}
      <div className="mb-4 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary-500" />
            <label className="text-sm font-medium text-gray-700">Financial Year:</label>
          </div>
          <select
            value={selectedFinancialYear}
            onChange={(e) => setSelectedFinancialYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-w-[140px] bg-white"
            disabled={isFinancialYearLoading}
          >
            {isFinancialYearLoading ? (
              <option value="">Loading...</option>
            ) : (
              financialYears.map((fy) => (
                <option key={fy.id} value={fy.year}>
                  {fy.year} {fy.status ? '✓' : ''}
                </option>
              ))
            )}
          </select>
          <span className="text-xs text-gray-400">
            {selectedFinancialYear ? `Showing: ${selectedFinancialYear}` : 'Please select a financial year'}
          </span>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {documents.length} document{documents.length !== 1 ? 's' : ''} for this year
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Upload & Documents (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Drop Zone */}
          <div
            className={`bg-white rounded-xl shadow-sm p-6 border-2 border-dashed transition-all ${
              isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="text-center cursor-pointer" onClick={() => libsReady && fileInputRef.current?.click()}>
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-semibold text-gray-700">
                {libsReady ? 'Drop files here, or click to choose' : 'Loading reader…'}
              </p>
              <p className="text-sm text-gray-400 mt-1">PDF &amp; Excel — read and matched by content, not filename</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={!libsReady}
              />
            </div>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin w-4 h-4" />
                Reading &amp; uploading...
              </div>
            )}
          </div>

          {/* Uploaded Files - Year Specific */}
          {documents.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Documents for {selectedFinancialYear}
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({documents.length} file{documents.length !== 1 ? 's' : ''})
                </span>
              </h3>
              <div className="space-y-3">
                {documents.map((doc) => {
                  const isProcessing = processingFiles[doc.file_title]
                  return (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.file_title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500">{doc.document_type}</span>
                                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                  {doc.fy_year || selectedFinancialYear}
                                </span>
                                {getStatusBadge(doc.status)}
                                {getClassificationBadge(doc)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {doc.extractionStatus && (
                            <button
                              onClick={() => toggleDebug(doc.id)}
                              className="text-[11px] text-gray-400 hover:text-gray-600 underline mt-1"
                            >
                              {debugOpenIds.has(doc.id) ? 'Hide' : 'Why?'} extraction details
                            </button>
                          )}
                          {debugOpenIds.has(doc.id) && (
                            <div className="mt-2 text-[11px] bg-gray-50 border border-gray-200 rounded p-2 space-y-2">
                              <div>
                                <span className="font-medium text-gray-600">Extracted text:</span>{' '}
                                <span className="text-gray-500">{doc.rawTextLength ?? 0} chars</span>
                              </div>
                              {doc.rawTextPreview && (
                                <pre className="whitespace-pre-wrap text-gray-500 bg-white border border-gray-100 rounded p-1.5 max-h-28 overflow-y-auto">
                                  {doc.rawTextPreview}{(doc.rawTextLength || 0) > 500 ? '…' : ''}
                                </pre>
                              )}
                              {doc.detected?.nearMisses?.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-600">Closest document types:</span>
                                  <ul className="mt-1 space-y-1">
                                    {doc.detected.nearMisses.map((nm, i) => (
                                      <li key={i} className="text-gray-500">
                                        {nm.label} — {nm.reqMet ? 'required phrase found' : `missing required phrase (e.g. "${nm.missingRequired[0]}")`}, supporting {nm.supHave}/{nm.supNeed}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!doc.rawTextPreview && (
                                <div className="text-gray-500">
                                  No text was extracted for this file.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bill As Dropdown */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Bill as</label>
                            <select
                              value={doc.bill_as || 'ignore'}
                              onChange={(e) => handleBillAsChange(doc.id, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                              {BILL_AS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                No documents uploaded for {selectedFinancialYear}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Upload documents to start building your estimated bill
              </p>
            </div>
          )}

          {/* Adjustments - Year Specific */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              2 · Adjustments for {selectedFinancialYear}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of house properties
              </label>
              <p className="text-xs text-gray-400 mb-2">The base fee covers up to 2. Each property beyond 2 adds ₹100.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={houseProperties}
                  onChange={(e) => setHouseProperties(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {documents.some(d => d.bill_as === 'houseProperty') && (
                  <span className="text-xs text-gray-400">House-loan document detected — confirm the count.</span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residential status
              </label>
              <p className="text-xs text-gray-400 mb-2">Not visible from any document — set it here.</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="residentialStatus"
                    value="resident"
                    checked={residentialStatus === 'resident'}
                    onChange={(e) => setResidentialStatus(e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-sm">Resident (no foreign income)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="residentialStatus"
                    value="nri"
                    checked={residentialStatus === 'nri'}
                    onChange={(e) => setResidentialStatus(e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-sm">Non-Resident Indian — adds ₹500</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="residentialStatus"
                    value="residentForeign"
                    checked={residentialStatus === 'residentForeign'}
                    onChange={(e) => setResidentialStatus(e.target.value)}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="text-sm">Resident with foreign income (DTAA / FTC / Form 67) — adds ₹750</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a stream with no document uploaded
              </label>
              <p className="text-xs text-gray-400 mb-2">
                For income the client mentioned but didn't (or couldn't) give a file for.
              </p>
              <div className="space-y-2">
                {MISSED_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={missedStreams.includes(option.id)}
                        onChange={(e) => {
                          if (e.target.checked) setMissedStreams([...missedStreams, option.id])
                          else setMissedStreams(missedStreams.filter(id => id !== option.id))
                        }}
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm">{option.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-500">+₹{option.amount}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Send to CA */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">3 · Send to your CA</h3>
            <p className="text-xs text-gray-400 mb-4">
              Once you've added everything you have for {selectedFinancialYear}, send it across — your CA will see every document,
              its detected type, and this estimated bill.
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{documents.length}</span> document{documents.length === 1 ? '' : 's'} ·{' '}
                <span className="font-medium text-gray-900">₹{estimatedBill.total}</span> estimated
              </div>
              <div className="flex items-center gap-3">
                {sentToCA && sentToCAAt && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Sent {format(sentToCAAt, 'd MMM, h:mm a')}
                  </span>
                )}
                <button
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendToCA}
                  disabled={sendingToCA || documents.length === 0 || isSendingRef.current || !selectedFinancialYear}
                >
                  {sendingToCA ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> 
                      Sending...
                    </span>
                  ) : sentToCA ? (
                    'Resend to CA'
                  ) : (
                    'Send to CA'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Fee Pamphlet, Estimated Bill & Computation Bill (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fee Pamphlet - Clickable Logo Card */}
          <div 
            className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer hover:shadow-md ${
              feeAccepted && !hasNewItems
                ? 'border-green-200 hover:border-green-300' 
                : feeAccepted && hasNewItems
                ? 'border-yellow-200 hover:border-yellow-300 animate-pulse'
                : 'border-gray-200 hover:border-primary-300'
            }`}
            onClick={() => setShowFeePamphletPopup(true)}
          >
            <div className="flex items-center justify-center flex-col py-4">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
                feeAccepted && !hasNewItems
                  ? 'bg-gradient-to-br from-green-500 to-green-600' 
                  : feeAccepted && hasNewItems
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-br from-primary-500 to-primary-600'
              }`}>
                {feeAccepted && !hasNewItems ? (
                  <BadgeCheck className="w-10 h-10 text-white" />
                ) : feeAccepted && hasNewItems ? (
                  <Sparkles className="w-10 h-10 text-white" />
                ) : (
                  <Receipt className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900">Fee Pamphlet</h3>
              
              {feeAccepted && !hasNewItems ? (
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Accepted
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Click to view your fee structure</p>
                </div>
              ) : feeAccepted && hasNewItems ? (
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    New Items Available
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Click to review new fee categories</p>
                </div>
              ) : feePamphlet ? (
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Acceptance
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Click to review and accept</p>
                </div>
              ) : (
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    Not Published
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Awaiting CA to publish</p>
                </div>
              )}
              
              {feePamphlet && feePamphlet.fee_data && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span>{feePamphlet.fee_data.length} items</span>
                  <span>•</span>
                  <span>₹{parseFloat(feePamphlet.grand_total || 0).toFixed(0)}</span>
                  {feePamphlet.version > 1 && (
                    <>
                      <span>•</span>
                      <span>v{feePamphlet.version}</span>
                    </>
                  )}
                </div>
              )}
              {feePamphletLoading && (
                <Loader2 className="w-4 h-4 text-primary-500 animate-spin mt-2" />
              )}
            </div>
          </div>

          {/* Estimated Bill - Year Specific */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary-500" />
                Estimated Bill - {selectedFinancialYear}
              </h3>
              <span className="text-xs text-gray-400">Indicative</span>
            </div>

            {estimatedBill.lines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">Upload a document or add a stream to see the estimate.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {estimatedBill.lines.map((line, idx) => (
                  <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100">
                    <div className="flex-1 pr-3">
                      <p className="text-sm font-medium text-gray-800">{line.label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          line.kind === 'base' ? 'bg-gray-100 text-gray-600' :
                          line.kind === 'detected' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {line.kind === 'base' ? 'base' : line.kind}
                        </span>
                        {line.src && line.src !== 'manual' && line.src !== 'property count' && (
                          <span className="text-xs text-gray-400 truncate max-w-[120px]">
                            · {line.src}
                          </span>
                        )}
                        {line.src === 'manual' && (
                          <span className="text-xs text-yellow-500">· Added manually</span>
                        )}
                        {line.src === 'property count' && (
                          <span className="text-xs text-blue-400">· From property count</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₹{line.amount}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                  <span className="text-base font-bold text-gray-900">Total estimate</span>
                  <span className="text-2xl font-bold text-primary-600">₹{estimatedBill.total}</span>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">
                    Indicative estimate based on the documents and inputs above for {selectedFinancialYear}. 
                    Final fee is confirmed after computation of income; if actual volume or effort is higher than reasonable estimates, 
                    we will take prior approval before revising.
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    className="btn-primary text-sm px-4 py-2"
                    onClick={() => {
                      const summary = estimatedBill.lines.map(l =>
                        `${l.label}: ₹${l.amount}${l.reason ? ` (${l.reason})` : ''}`
                      ).join('\n')
                      const totalText = `Total: ₹${estimatedBill.total}`
                      navigator.clipboard.writeText([...summary.split('\n'), totalText].join('\n'))
                      safeToast.success('Summary copied to clipboard')
                    }}
                  >
                    Copy summary
                  </button>
                  <button
                    className="btn-outline text-sm px-4 py-2"
                    onClick={() => {
                      setDocuments([])
                      setHouseProperties(0)
                      setResidentialStatus('resident')
                      setMissedStreams([])
                      safeToast.success('Cleared all for this year')
                    }}
                  >
                    Clear all
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Shield className="w-3 h-3" />
                  Files are read locally in this browser before upload.
                </div>
              </div>
            )}
          </div>

          {/* Computation Bill - shown when CA has sent one */}
          {computationBillLoading ? (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                <span className="ml-2 text-sm text-gray-500">Loading computation bill...</span>
              </div>
            </div>
          ) : computationBill && (
            (computationBill.status === 'SENT_TO_CLIENT' || 
             computationBill.status === 'SENT' || 
             computationBill.status === 'CONFIRMED_BY_CLIENT' || 
             computationBill.status === 'CONFIRMED') ? (
              <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') 
                  ? 'border-green-200' 
                  : 'border-primary-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileCheck className={`w-4 h-4 ${
                      (computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') 
                        ? 'text-green-500' 
                        : 'text-primary-500'
                    }`} />
                    Computation Bill
                  </h3>
                  <div className="flex items-center gap-2">
                    {getComputationBillStatusBadge(computationBill.status)}
                    {computationBill.submission_status === 'CONFIRMED' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Submission Confirmed
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {computationBill.fee_components && computationBill.fee_components.length > 0 ? (
                    computationBill.fee_components.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between py-2 border-b border-gray-100">
                        <div className="flex-1 pr-3">
                          <p className="text-sm font-medium text-gray-800">{item.label || item.description || 'Fee Component'}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {item.category || 'Fee'}
                            </span>
                            {item.document_name && (
                              <span className="text-xs text-gray-400">· {item.document_name}</span>
                            )}
                            {item.is_base && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">Base</span>
                            )}
                            {item.is_extra && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Extra</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">₹{item.amount || 0}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">No fee components found</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ₹{computationBill.total || 0}
                    </span>
                  </div>

                  {computationBill.notes && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-700">{computationBill.notes}</p>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">
                      The CA has prepared this computation bill based on your documents and the fee structure.
                      Please review the details carefully before proceeding.
                    </p>
                  </div>

                  {(computationBill.status === 'SENT_TO_CLIENT' || computationBill.status === 'SENT') && (
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        className="btn-primary text-sm px-6 py-2.5 flex-1 disabled:opacity-50"
                        onClick={handleConfirmAndProceed}
                        disabled={confirmingBill || proceedingToCA}
                      >
                        {confirmingBill ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Confirming...
                          </span>
                        ) : proceedingToCA ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          '✅ Confirm & Proceed'
                        )}
                      </button>
                      <button
                        className="btn-outline text-sm px-4 py-2.5 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={handleCancelComputationBill}
                        disabled={cancellingBill}
                      >
                        {cancellingBill ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    </div>
                  )}

                  {(computationBill.status === 'CONFIRMED_BY_CLIENT' || computationBill.status === 'CONFIRMED') && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-700 font-medium">
                          ✅ You have confirmed this computation bill. It has been sent to your CA for final processing.
                        </p>
                      </div>
                      {computationBill.confirmed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Confirmed on {format(new Date(computationBill.confirmed_at), 'd MMM yyyy, h:mm a')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Fee Pamphlet Popup - View Only (triggered by clicking the logo) */}
      <FeePamplatePopup 
        isOpen={showFeePamphletPopup} 
        onAccept={() => {
          setShowFeePamphletPopup(false)
          fetchClientData()
        }}
        isViewOnly={true}
        initialData={pamplateData}
        statusData={feeStatus}
      />
    </DashboardLayout>
  )
}

export default ClientDashboard