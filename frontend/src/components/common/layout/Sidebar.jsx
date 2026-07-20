// import React, { useState, useEffect } from 'react'
// import { Link, useLocation, useNavigate } from 'react-router-dom'
// import { motion, AnimatePresence } from 'framer-motion'
// import { 
//   LayoutDashboard, 
//   Users, 
//   FileText, 
//   DollarSign, 
//   BarChart3, 
//   Settings,
//   LogOut,
//   Menu,
//   X,
//   UserPlus,
//   Building2,
//   Activity,
//   UserCog,
//   FileCheck,
//   Upload,
//   CreditCard,
//   Clock,
//   ChevronDown,
//   ChevronRight,
//   Plus,
//   List,
//   FolderOpen,
//   Receipt,
//   TrendingUp,
//   HelpCircle,
//   Mail,
//   Bell,
//   Calendar,
//   ClipboardList,
//   UserCheck,
//   FileSpreadsheet,
//   Shield,
//   Home,
//   BookOpen,
//   Database,
//   PieChart,
//   MessageSquare,
//   Download,
//   Eye,
//   CheckSquare,
//   AlertTriangle,
//   Users as UsersIcon,
//   Search,
//   Filter,
//   Globe,
//   Lock,
//   Key,
//   Smartphone,
//   Monitor,
//   Server,
//   Cloud,
//   ShieldCheck,
//   Zap,
//   Award,
//   Star,
//   Heart,
//   Target,
//   Compass,
//   MapPin,
//   Briefcase,
//   GraduationCap,
//   Trophy,
//   Medal,
//   Crown,
//   Flag,
//   Book,
//   Library,
//   Layers,
//   Grid,
//   Sliders,
//   ToggleLeft,
//   ToggleRight,
//   Circle,
//   Square,
//   Hexagon,
//   Octagon,
//   Diamond,
//   Triangle,
//   UserCircle,
//   Settings2,
//   LogIn,
//   LogOut as LogOutIcon,
//   Menu as MenuIcon
// } from 'lucide-react'
// import { useAuth } from '../../../hooks/useAuth'

// const Sidebar = ({ isOpen, setIsOpen }) => {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const { logout, user } = useAuth()
//   const [isMobile, setIsMobile] = useState(false)
//   const [expandedMenus, setExpandedMenus] = useState({})
//   const [hoveredItem, setHoveredItem] = useState(null)

//   // Handle responsive sidebar
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 1024
//       setIsMobile(mobile)
//       if (mobile && isOpen) {
//         setIsOpen(false)
//       }
//     }
//     handleResize()
//     window.addEventListener('resize', handleResize)
//     return () => window.removeEventListener('resize', handleResize)
//   }, [isOpen, setIsOpen])

//   const handleLogout = () => {
//     logout()
//     navigate('/login')
//   }

//   const toggleSidebar = () => {
//     setIsOpen(!isOpen)
//   }

//   const toggleMenu = (menuKey) => {
//     setExpandedMenus(prev => ({
//       ...prev,
//       [menuKey]: !prev[menuKey]
//     }))
//   }

//   // Get user role badge color
//   const getRoleBadgeColor = () => {
//     switch(user?.role) {
//       case 'SUPER_ADMIN':
//         return 'bg-gradient-to-r from-purple-500 to-purple-600'
//       case 'CA':
//         return 'bg-gradient-to-r from-blue-500 to-blue-600'
//       case 'CLIENT':
//         return 'bg-gradient-to-r from-green-500 to-green-600'
//       default:
//         return 'bg-gradient-to-r from-gray-500 to-gray-600'
//     }
//   }

//   // Get user role display name
//   const getRoleDisplayName = () => {
//     switch(user?.role) {
//       case 'SUPER_ADMIN':
//         return 'Super Admin'
//       case 'CA':
//         return 'CA Firm'
//       case 'CLIENT':
//         return 'Client'
//       default:
//         return 'User'
//     }
//   }

//   // Get user role icon
//   const getRoleIcon = () => {
//     switch(user?.role) {
//       case 'SUPER_ADMIN':
//         return Shield
//       case 'CA':
//         return Building2
//       case 'CLIENT':
//         return UserCircle
//       default:
//         return UserCircle
//     }
//   }

//   // Get user initials
//   const getUserInitials = () => {
//     if (!user?.name) return 'U'
//     return user.name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2)
//   }

//   // Navigation items based on user role
//   const getNavItems = () => {
//     if (!user) return []

//     // FIX: Use uppercase role names to match backend
//     switch(user.role) {
//       case 'SUPER_ADMIN':
//         return [
//           {
//             id: 'super-dashboard',
//             label: 'Dashboard',
//             icon: LayoutDashboard,
//             path: '/super-admin/dashboard',
//             description: 'Overview & Stats',
//             color: 'text-purple-400'
//           },
//           {
//             id: 'super-ca-management',
//             label: 'CA Management',
//             icon: Building2,
//             path: '/super-admin/ca-management',
//             description: 'Manage CA Accounts',
//             color: 'text-blue-400',
//             children: [
//               { id: 'super-all-cas', label: 'All CAs', path: '/super-admin/ca-management', icon: List },
//               { id: 'super-create-ca', label: 'Create CA', path: '/super-admin/create-ca', icon: UserPlus },
//             ]
//           },
//           {
//             id: 'super-client-management',
//             label: 'Client Management',
//             icon: UsersIcon,
//             path: '/super-admin/clients',
//             description: 'Manage All Clients',
//             color: 'text-green-400',
//             children: [
//               { id: 'super-all-clients', label: 'All Clients', path: '/super-admin/clients', icon: List },
//               { id: 'super-create-client', label: 'Create Client', path: '/super-admin/create-client', icon: UserPlus },
//             ]
//           },
//           {
//             id: 'super-audit-logs',
//             label: 'Audit Logs',
//             icon: Activity,
//             path: '/super-admin/audit-logs',
//             description: 'System Activities',
//             color: 'text-orange-400'
//           },
//           {
//             id: 'super-settings',
//             label: 'System Settings',
//             icon: Settings,
//             path: '/super-admin/settings',
//             description: 'Configure System',
//             color: 'text-gray-400'
//           },
//         ]

//       case 'CLIENT':
//         return [
//           {
//             id: 'client-dashboard',
//             label: 'Dashboard',
//             icon: LayoutDashboard,
//             path: '/client/dashboard',
//             description: 'Your Overview',
//             color: 'text-blue-400'
//           },
//           {
//             id: 'client-documents',
//             label: 'Documents',
//             icon: FolderOpen,
//             path: '/client/documents',
//             description: 'Upload & View',
//             color: 'text-yellow-400',
//             children: [
//               { id: 'client-upload', label: 'Upload Documents', path: '/client/documents', icon: Upload },
//               { id: 'client-my-docs', label: 'My Documents', path: '/client/documents', icon: FileText },
//             ]
//           },
//           {
//             id: 'client-invoices',
//             label: 'Invoices & Payments',
//             icon: CreditCard,
//             path: '/client/invoices',
//             description: 'Billing & Payments',
//             color: 'text-green-400',
//             children: [
//               { id: 'client-all-invoices', label: 'All Invoices', path: '/client/invoices', icon: Receipt },
//               { id: 'client-payment-history', label: 'Payment History', path: '/client/invoices', icon: CreditCard },
//             ]
//           },
//           {
//             id: 'client-status',
//             label: 'Status Tracker',
//             icon: Clock,
//             path: '/client/status',
//             description: 'Case Progress',
//             color: 'text-purple-400'
//           },
//           {
//             id: 'client-support',
//             label: 'Support',
//             icon: HelpCircle,
//             path: '/client/support',
//             description: 'Get Help',
//             color: 'text-red-400'
//           },
//           {
//             id: 'client-fee-pamplate',
//             label: 'Fee Pamplate',
//             icon: Receipt,
//             path: '/client/fee-pamplate',
//             description: 'View your fee structure',
//             color: 'text-pink-400'
//           }
//         ]

//       default: // CA or Staff
//         return [
//           {
//             id: 'ca-dashboard',
//             label: 'Dashboard',
//             icon: LayoutDashboard,
//             path: '/ca/dashboard',
//             description: 'Overview & Stats',
//             color: 'text-blue-400'
//           },
//           {
//             id: 'ca-clients',
//             label: 'Clients',
//             icon: UsersIcon,
//             path: '/ca/clients',
//             description: 'Manage Clients',
//             color: 'text-green-400',
//             children: [
//               { id: 'ca-all-clients', label: 'All Clients', path: '/ca/clients', icon: List },
//               { id: 'ca-add-client', label: 'Add Client', path: '/ca/clients/add', icon: UserPlus },
//             ]
//           },
//           {
//             id: 'ca-documents',
//             label: 'Documents',
//             icon: FileText,
//             path: '/ca/documents',
//             description: 'Document Management',
//             color: 'text-yellow-400',
//             children: [
//               { id: 'ca-all-docs', label: 'All Documents', path: '/ca/documents', icon: FileText },
//               { id: 'ca-request-docs', label: 'Request Documents', path: '/ca/documents/request', icon: Upload },
//             ]
//           },
//           {
//             id: 'ca-fees',
//             label: 'Fee Structure',
//             icon: DollarSign,
//             path: '/ca/fees',
//             description: 'Manage Fees',
//             color: 'text-purple-400'
//           },
//           {
//             id: 'ca-invoices',
//             label: 'Invoices',
//             icon: BarChart3,
//             path: '/ca/invoices',
//             description: 'Billing & Invoicing',
//             color: 'text-pink-400',
//             children: [
//               { id: 'ca-all-invoices', label: 'All Invoices', path: '/ca/invoices', icon: Receipt },
//               { id: 'ca-generate-invoice', label: 'Generate Invoice', path: '/ca/invoices/generate', icon: Plus },
//             ]
//           },
//           {
//   id: 'ca-submissions',
//   label: 'Client Submissions',
//   icon: FileText,
//   path: '/ca/submissions',
//   description: 'Review client fee estimations',
//   color: 'text-indigo-400'
// },
//           {
//             id: 'ca-reports',
//             label: 'Reports',
//             icon: TrendingUp,
//             path: '/ca/reports',
//             description: 'Analytics & Reports',
//             color: 'text-indigo-400'
//           },
//           {
//             id: 'ca-settings',
//             label: 'Settings',
//             icon: Settings,
//             path: '/ca/settings',
//             description: 'Account Settings',
//             color: 'text-gray-400'
//           },
//         ]
//     }
//   }

//   const navItems = getNavItems()

//   // Check if a path is active
//   const isPathActive = (path) => {
//     if (!path) return false
//     return location.pathname === path || location.pathname.startsWith(path + '/')
//   }

//   // Check if any child path is active
//   const isChildActive = (children) => {
//     if (!children) return false
//     return children.some(child => isPathActive(child.path))
//   }

//   // Render sidebar content
//   const renderSidebarContent = () => {
//     return (
//       <>
//         {/* Logo & Toggle */}
//         <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
//           <div className={`flex items-center space-x-3 ${!isOpen && 'justify-center w-full'}`}>
//             <div className="relative">
//               <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
//                 <span className="text-primary-500 font-bold text-lg">CA</span>
//               </div>
//               {isOpen && (
//                 <motion.div 
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-500"
//                 />
//               )}
//             </div>
//             {isOpen && (
//               <motion.div
//                 initial={{ opacity: 0, x: -10 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.3 }}
//               >
//                 <span className="text-lg font-bold text-white tracking-tight">CA Firm</span>
//                 <span className="block text-[10px] text-primary-200 font-light tracking-wider">MANAGEMENT</span>
//               </motion.div>
//             )}
//           </div>
//           {!isMobile && (
//             <button 
//               onClick={toggleSidebar}
//               className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white group"
//             >
//               {isOpen ? (
//                 <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
//               ) : (
//                 <Menu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
//               )}
//             </button>
//           )}
//           {isMobile && (
//             <button 
//               onClick={() => setIsOpen(false)}
//               className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
//             >
//               <X size={20} />
//             </button>
//           )}
//         </div>

//         {/* User Profile */}
//         {user && (
//           <div className={`p-4 border-b border-white/10 ${!isOpen && 'flex justify-center'}`}>
//             <motion.div 
//               className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}
//               whileHover={{ scale: 1.02 }}
//               transition={{ type: "spring", stiffness: 400, damping: 10 }}
//             >
//               <div className="relative">
//                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${getRoleBadgeColor()} text-white`}>
//                   {getUserInitials()}
//                 </div>
//                 <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary-500"></div>
//               </div>
//               {isOpen && (
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
//                   <div className="flex items-center space-x-2 mt-0.5">
//                     <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadgeColor()} text-white font-medium`}>
//                       {getRoleDisplayName()}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           </div>
//         )}

//         {/* Navigation */}
//         <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
//           {navItems.map((item, index) => {
//             const hasChildren = item.children && item.children.length > 0
//             const isExpanded = expandedMenus[index] || isChildActive(item.children)
//             const isActive = isPathActive(item.path)
//             const Icon = item.icon

//             if (hasChildren) {
//               return (
//                 <div key={item.id || index} className="mb-1">
//                   <motion.button
//                     onClick={() => isOpen && toggleMenu(index)}
//                     onMouseEnter={() => setHoveredItem(index)}
//                     onMouseLeave={() => setHoveredItem(null)}
//                     className={`
//                       w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
//                       ${isActive || isChildActive(item.children) 
//                         ? 'bg-white/20 text-white shadow-lg' 
//                         : 'text-white/70 hover:text-white hover:bg-white/10'
//                       }
//                       ${!isOpen && 'justify-center px-2'}
//                       group relative
//                     `}
//                     title={!isOpen ? item.label : ''}
//                   >
//                     <div className={`p-1.5 rounded-lg ${isActive || isChildActive(item.children) ? 'bg-white/20' : ''}`}>
//                       <Icon size={20} className={`${isActive || isChildActive(item.children) ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
//                     </div>
//                     {isOpen && (
//                       <div className="flex-1 flex items-center justify-between ml-3">
//                         <div className="flex-1 min-w-0 text-left">
//                           <p className={`text-sm font-medium truncate ${isActive || isChildActive(item.children) ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
//                             {item.label}
//                           </p>
//                           <p className="text-[10px] text-white/50 truncate">{item.description}</p>
//                         </div>
//                         <motion.div
//                           animate={{ rotate: isExpanded ? 180 : 0 }}
//                           transition={{ duration: 0.3 }}
//                           className="text-white/50"
//                         >
//                           <ChevronDown size={16} />
//                         </motion.div>
//                       </div>
//                     )}
//                     {!isOpen && (
//                       <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
//                         {item.label}
//                         <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
//                       </div>
//                     )}
//                   </motion.button>
                  
//                   <AnimatePresence>
//                     {isOpen && isExpanded && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: 'auto' }}
//                         exit={{ opacity: 0, height: 0 }}
//                         transition={{ duration: 0.3 }}
//                         className="ml-4 pl-4 border-l-2 border-white/20 mt-1 space-y-0.5"
//                       >
//                         {item.children.map((child) => {
//                           const isChildActive = isPathActive(child.path)
//                           const ChildIcon = child.icon
//                           return (
//                             <Link
//                               key={child.id || child.path}
//                               to={child.path}
//                               className={`
//                                 flex items-center px-3 py-2 rounded-lg transition-all duration-200
//                                 ${isChildActive 
//                                   ? 'bg-white/20 text-white' 
//                                   : 'text-white/60 hover:text-white hover:bg-white/10'
//                                 }
//                               `}
//                             >
//                               <ChildIcon size={16} className="flex-shrink-0" />
//                               <span className="ml-3 text-sm">{child.label}</span>
//                               {isChildActive && (
//                                 <motion.div
//                                   initial={{ scale: 0 }}
//                                   animate={{ scale: 1 }}
//                                   className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
//                                 />
//                               )}
//                             </Link>
//                           )
//                         })}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               )
//             }

//             return (
//               <Link
//                 key={item.id || index}
//                 to={item.path}
//                 className={`
//                   flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
//                   ${isActive 
//                     ? 'bg-white/20 text-white shadow-lg' 
//                     : 'text-white/70 hover:text-white hover:bg-white/10'
//                   }
//                   ${!isOpen && 'justify-center px-2'}
//                   group relative
//                 `}
//                 onMouseEnter={() => setHoveredItem(index)}
//                 onMouseLeave={() => setHoveredItem(null)}
//               >
//                 <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : ''}`}>
//                   <Icon size={20} className={`${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
//                 </div>
//                 {isOpen && (
//                   <div className="flex-1 min-w-0 ml-3">
//                     <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
//                       {item.label}
//                     </p>
//                     <p className="text-[10px] text-white/50 truncate">{item.description}</p>
//                   </div>
//                 )}
//                 {isActive && isOpen && (
//                   <motion.div
//                     initial={{ scale: 0 }}
//                     animate={{ scale: 1 }}
//                     className="w-1.5 h-1.5 bg-white rounded-full"
//                   />
//                 )}
//                 {!isOpen && (
//                   <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
//                     {item.label}
//                     <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
//                   </div>
//                 )}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Bottom Section */}
//         <div className="border-t border-white/10 p-4 flex-shrink-0">
//           {isOpen && (
//             <motion.div 
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mb-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm"
//             >
//               <div className="flex items-center space-x-2">
//                 <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
//                   <HelpCircle className="w-4 h-4 text-white/70" />
//                 </div>
//                 <div className="flex-1">
//                   <p className="text-xs font-medium text-white">Need help?</p>
//                   <p className="text-[10px] text-white/50">Contact support</p>
//                 </div>
//               </div>
//               <div className="flex space-x-2 mt-2">
//                 <button className="flex-1 text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
//                   <Mail className="w-3 h-3 mr-1" />
//                   Email
//                 </button>
//                 <button className="flex-1 text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
//                   <MessageSquare className="w-3 h-3 mr-1" />
//                   Chat
//                 </button>
//               </div>
//             </motion.div>
//           )}
          
//           <motion.button
//             onClick={handleLogout}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className={`
//               flex items-center w-full px-3 py-2.5 rounded-xl 
//               hover:bg-red-500/20 transition-all duration-200
//               ${!isOpen && 'justify-center px-2'}
//               group relative text-white/70 hover:text-red-400
//             `}
//           >
//             <LogOutIcon size={20} className="flex-shrink-0" />
//             {isOpen && <span className="ml-3 text-sm">Logout</span>}
//             {!isOpen && (
//               <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
//                 Logout
//                 <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
//               </div>
//             )}
//           </motion.button>
          
//           {isOpen && (
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               className="mt-3 flex items-center justify-between text-[10px] text-white/30"
//             >
//               <span>Version 2.0.0</span>
//               <span className="flex items-center">
//                 <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
//                 Online
//               </span>
//             </motion.div>
//           )}
//         </div>
//       </>
//     )
//   }

//   // Mobile overlay
//   if (isMobile && isOpen) {
//     return (
//       <>
//         <motion.div 
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
//           onClick={() => setIsOpen(false)}
//         />
//         <motion.aside
//           initial={{ x: -280 }}
//           animate={{ x: 0 }}
//           exit={{ x: -280 }}
//           transition={{ type: "spring", damping: 25, stiffness: 200 }}
//           className={`
//             fixed top-0 left-0 h-full bg-gradient-to-b from-primary-600 via-primary-500 to-primary-700 text-white z-50
//             w-72 flex flex-col shadow-2xl
//           `}
//         >
//           {renderSidebarContent()}
//         </motion.aside>
//       </>
//     )
//   }

//   // Desktop sidebar
//   return (
//     <motion.aside
//       initial={false}
//       animate={{ width: isOpen ? 280 : 80 }}
//       transition={{ type: "spring", damping: 25, stiffness: 200 }}
//       className={`
//         fixed top-0 left-0 h-full bg-gradient-to-b from-primary-600 via-primary-500 to-primary-700 text-white z-40
//         hidden lg:flex flex-col shadow-2xl
//         ${isOpen ? 'w-72' : 'w-20'}
//       `}
//     >
//       {renderSidebarContent()}
//     </motion.aside>
//   )
// }

// export default Sidebar






// src/components/common/Layout/Sidebar.jsx
import React, { useState, useEffect } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  Building2,
  Activity,
  UserCog,
  FileCheck,
  Upload,
  CreditCard,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  FolderOpen,
  Receipt,
  TrendingUp,
  HelpCircle,
  Mail,
  Bell,
  Calendar,
  ClipboardList,
  UserCheck,
  FileSpreadsheet,
  Shield,
  Home,
  BookOpen,
  Database,
  PieChart,
  MessageSquare,
  Download,
  Eye,
  CheckSquare,
  AlertTriangle,
  Users as UsersIcon,
  Search,
  Filter,
  Globe,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Server,
  Cloud,
  ShieldCheck,
  Zap,
  Award,
  Star,
  Heart,
  Target,
  Compass,
  MapPin,
  Briefcase,
  GraduationCap,
  Trophy,
  Medal,
  Crown,
  Flag,
  Book,
  Library,
  Layers,
  Grid,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Circle,
  Square,
  Hexagon,
  Octagon,
  Diamond,
  Triangle,
  UserCircle,
  Settings2,
  LogIn,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  MailPlus,
  Inbox,
  Send,
  Archive,
  RefreshCw,
  Folder,
  Paperclip,
  MessageCircle,
  Phone,
  Video,
  Camera,
  Image,
  Music,
  Film,
  Bookmark,
  Check,
  X as XIcon,
  Minus,
  Plus as PlusIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Move,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ListOrdered,
  List as ListBullet,
  Indent,
  Outdent,
  Code,
  Link as LinkIcon,
  Link2,
  Unlink,
  ExternalLink,
  Share,
  Share2,
  Heart as HeartIcon,
  ThumbsUp,
  ThumbsDown,
  Star as StarIcon,
  Award as AwardIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Crown as CrownIcon,
  Flag as FlagIcon,
  Book as BookIcon,
  Library as LibraryIcon,
  Layers as LayersIcon,
  Grid as GridIcon,
  Sliders as SlidersIcon,
  Circle as CircleIcon,
  Square as SquareIcon,
  Hexagon as HexagonIcon,
  Octagon as OctagonIcon,
  Diamond as DiamondIcon,
  Triangle as TriangleIcon
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const [hoveredItem, setHoveredItem] = useState(null)

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile && isOpen) {
        setIsOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, setIsOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  // Get user role badge color
  const getRoleBadgeColor = () => {
    switch(user?.role) {
      case 'SUPER_ADMIN':
        return 'bg-gradient-to-r from-purple-500 to-purple-600'
      case 'CA':
        return 'bg-gradient-to-r from-blue-500 to-blue-600'
      case 'CLIENT':
        return 'bg-gradient-to-r from-green-500 to-green-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  // Get user role display name
  const getRoleDisplayName = () => {
    switch(user?.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'CA':
        return 'CA Firm'
      case 'CLIENT':
        return 'Client'
      default:
        return 'User'
    }
  }

  // Get user role icon
  const getRoleIcon = () => {
    switch(user?.role) {
      case 'SUPER_ADMIN':
        return Shield
      case 'CA':
        return Building2
      case 'CLIENT':
        return UserCircle
      default:
        return UserCircle
    }
  }

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return []

    switch(user.role) {
      case 'SUPER_ADMIN':
        return [
          {
            id: 'super-dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/super-admin/dashboard',
            description: 'Overview & Stats',
            color: 'text-purple-400'
          },
          {
            id: 'super-ca-management',
            label: 'CA Management',
            icon: Building2,
            path: '/super-admin/ca-management',
            description: 'Manage CA Accounts',
            color: 'text-blue-400',
            children: [
              { id: 'super-all-cas', label: 'All CAs', path: '/super-admin/ca-management', icon: List },
              { id: 'super-create-ca', label: 'Create CA', path: '/super-admin/create-ca', icon: UserPlus },
            ]
          },
          {
            id: 'super-client-management',
            label: 'Client Management',
            icon: UsersIcon,
            path: '/super-admin/clients',
            description: 'Manage All Clients',
            color: 'text-green-400',
            children: [
              { id: 'super-all-clients', label: 'All Clients', path: '/super-admin/clients', icon: List },
              { id: 'super-create-client', label: 'Create Client', path: '/super-admin/create-client', icon: UserPlus },
            ]
          },
          {
            id: 'super-audit-logs',
            label: 'Audit Logs',
            icon: Activity,
            path: '/super-admin/audit-logs',
            description: 'System Activities',
            color: 'text-orange-400'
          },
          {
            id: 'super-settings',
            label: 'System Settings',
            icon: Settings,
            path: '/super-admin/settings',
            description: 'Configure System',
            color: 'text-gray-400'
          },
        ]

      case 'CLIENT':
        return [
          {
            id: 'client-dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/client/dashboard',
            description: 'Your Overview',
            color: 'text-blue-400'
          },
          {
            id: 'client-documents',
            label: 'My Documents',
            icon: FolderOpen,
            path: '/client/documents',
            description: 'Upload & View',
            color: 'text-yellow-400',
            children: [
              { id: 'client-upload', label: 'Upload Documents', path: '/client/documents', icon: Upload },
              { id: 'client-my-docs', label: 'My Documents', path: '/client/documents', icon: FileText },
              { id: 'client-ca-docs', label: "CA's Documents", path: '/client/documents', icon: FileCheck },
            ]
          },
          {
            id: 'client-invoices',
            label: 'Invoices & Payments',
            icon: CreditCard,
            path: '/client/invoices',
            description: 'Billing & Payments',
            color: 'text-green-400',
            children: [
              { id: 'client-all-invoices', label: 'All Invoices', path: '/client/invoices', icon: Receipt },
              { id: 'client-payment-history', label: 'Payment History', path: '/client/invoices', icon: CreditCard },
            ]
          },
          {
            id: 'client-submissions',
            label: 'Submissions',
            icon: ClipboardList,
            path: '/client/submissions',
            description: 'Your Submissions',
            color: 'text-indigo-400'
          },
          {
            id: 'client-status',
            label: 'Status Tracker',
            icon: Clock,
            path: '/client/status',
            description: 'Case Progress',
            color: 'text-purple-400'
          },
          {
            id: 'client-fee-pamplate',
            label: 'Fee Pamplate',
            icon: Receipt,
            path: '/client/fee-pamplate',
            description: 'View your fee structure',
            color: 'text-pink-400'
          }
        ]

      default: // CA or Staff
        return [
          {
            id: 'ca-dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            path: '/ca/dashboard',
            description: 'Overview & Stats',
            color: 'text-blue-400'
          },
          {
            id: 'ca-clients',
            label: 'Clients',
            icon: UsersIcon,
            path: '/ca/clients',
            description: 'Manage Clients',
            color: 'text-green-400',
            children: [
              { id: 'ca-all-clients', label: 'All Clients', path: '/ca/clients', icon: List },
              { id: 'ca-add-client', label: 'Add Client', path: '/ca/clients/add', icon: UserPlus },
            ]
          },
          // ✅ UPDATED: Documents section with two sub-items
          {
            id: 'ca-documents',
            label: 'Documents',
            icon: FileText,
            path: '/ca/documents',
            description: 'Document Management',
            color: 'text-yellow-400',
            children: [
              { 
                id: 'ca-client-submissions', 
                label: 'Client Submissions', 
                path: '/ca/submissions', 
                icon: ClipboardList,
                description: 'View client submissions'
              },
              { 
                id: 'ca-client-documents', 
                label: 'Client Documents', 
                path: '/ca/documents', 
                icon: FileText,
                description: 'Manage client documents'
              },
            ]
          },
          {
            id: 'ca-fees',
            label: 'Fee Structure',
            icon: DollarSign,
            path: '/ca/fees',
            description: 'Manage Fees',
            color: 'text-purple-400'
          },
          {
            id: 'ca-invoices',
            label: 'Invoices',
            icon: BarChart3,
            path: '/ca/invoices',
            description: 'Billing & Invoicing',
            color: 'text-pink-400',
            children: [
              { id: 'ca-all-invoices', label: 'All Invoices', path: '/ca/invoices', icon: Receipt },
              { id: 'ca-generate-invoice', label: 'Generate Invoice', path: '/ca/invoices/generate', icon: Plus },
            ]
          },
          {
            id: 'ca-reports',
            label: 'Reports',
            icon: TrendingUp,
            path: '/ca/reports',
            description: 'Analytics & Reports',
            color: 'text-indigo-400'
          },
          {
            id: 'ca-settings',
            label: 'Settings',
            icon: Settings,
            path: '/ca/settings',
            description: 'Account Settings',
            color: 'text-gray-400'
          },
        ]
    }
  }

  const navItems = getNavItems()

  // Check if a path is active
  const isPathActive = (path) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Check if any child path is active
  const isChildActive = (children) => {
    if (!children) return false
    return children.some(child => isPathActive(child.path))
  }

  // Render sidebar content
  const renderSidebarContent = () => {
    return (
      <>
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className={`flex items-center space-x-3 ${!isOpen && 'justify-center w-full'}`}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-primary-500 font-bold text-lg">CA</span>
              </div>
              {isOpen && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-500"
                />
              )}
            </div>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-lg font-bold text-white tracking-tight">CA Firm</span>
                <span className="block text-[10px] text-primary-200 font-light tracking-wider">MANAGEMENT</span>
              </motion.div>
            )}
          </div>
          {!isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white group"
            >
              {isOpen ? (
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Menu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              )}
            </button>
          )}
          {isMobile && (
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Profile */}
        {user && (
          <div className={`p-4 border-b border-white/10 ${!isOpen && 'flex justify-center'}`}>
            <motion.div 
              className={`flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${getRoleBadgeColor()} text-white`}>
                  {getUserInitials()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary-500"></div>
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name || 'User'}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadgeColor()} text-white font-medium`}>
                      {getRoleDisplayName()}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {navItems.map((item, index) => {
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedMenus[index] || isChildActive(item.children)
            const isActive = isPathActive(item.path)
            const Icon = item.icon

            if (hasChildren) {
              return (
                <div key={item.id || index} className="mb-1">
                  <motion.button
                    onClick={() => isOpen && toggleMenu(index)}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                      w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive || isChildActive(item.children) 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }
                      ${!isOpen && 'justify-center px-2'}
                      group relative
                    `}
                    title={!isOpen ? item.label : ''}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive || isChildActive(item.children) ? 'bg-white/20' : ''}`}>
                      <Icon size={20} className={`${isActive || isChildActive(item.children) ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
                    </div>
                    {isOpen && (
                      <div className="flex-1 flex items-center justify-between ml-3">
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-sm font-medium truncate ${isActive || isChildActive(item.children) ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-white/50 truncate">{item.description}</p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-white/50"
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    )}
                    {!isOpen && (
                      <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                        {item.label}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </motion.button>
                  
                  <AnimatePresence>
                    {isOpen && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="ml-4 pl-4 border-l-2 border-white/20 mt-1 space-y-0.5"
                      >
                        {item.children.map((child) => {
                          const isChildActive = isPathActive(child.path)
                          const ChildIcon = child.icon
                          return (
                            <RouterLink
                              key={child.id || child.path}
                              to={child.path}
                              className={`
                                flex items-center px-3 py-2 rounded-lg transition-all duration-200
                                ${isChildActive 
                                  ? 'bg-white/20 text-white' 
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                                }
                              `}
                            >
                              <ChildIcon size={16} className="flex-shrink-0" />
                              <span className="ml-3 text-sm">{child.label}</span>
                              {isChildActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                                />
                              )}
                            </RouterLink>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }

            return (
              <RouterLink
                key={item.id || index}
                to={item.path}
                className={`
                  flex items-center px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                  ${!isOpen && 'justify-center px-2'}
                  group relative
                `}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : ''}`}>
                  <Icon size={20} className={`${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} transition-colors`} />
                </div>
                {isOpen && (
                  <div className="flex-1 min-w-0 ml-3">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-white/50 truncate">{item.description}</p>
                  </div>
                )}
                {isActive && isOpen && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
                {!isOpen && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </RouterLink>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-4 flex-shrink-0">
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">Need help?</p>
                  <p className="text-[10px] text-white/50">Contact support</p>
                </div>
              </div>
              <div className="flex space-x-2 mt-2">
                <button className="flex-1 text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </button>
                <button className="flex-1 text-[10px] bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Chat
                </button>
              </div>
            </motion.div>
          )}
          
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center w-full px-3 py-2.5 rounded-xl 
              hover:bg-red-500/20 transition-all duration-200
              ${!isOpen && 'justify-center px-2'}
              group relative text-white/70 hover:text-red-400
            `}
          >
            <LogOutIcon size={20} className="flex-shrink-0" />
            {isOpen && <span className="ml-3 text-sm">Logout</span>}
            {!isOpen && (
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Logout
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </motion.button>
          
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center justify-between text-[10px] text-white/30"
            >
              <span>Version 2.0.0</span>
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                Online
              </span>
            </motion.div>
          )}
        </div>
      </>
    )
  }

  // Mobile overlay
  if (isMobile && isOpen) {
    return (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`
            fixed top-0 left-0 h-full bg-gradient-to-b from-primary-600 via-primary-500 to-primary-700 text-white z-50
            w-72 flex flex-col shadow-2xl
          `}
        >
          {renderSidebarContent()}
        </motion.aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-primary-600 via-primary-500 to-primary-700 text-white z-40
        hidden lg:flex flex-col shadow-2xl
        ${isOpen ? 'w-72' : 'w-20'}
      `}
    >
      {renderSidebarContent()}
    </motion.aside>
  )
}

export default Sidebar