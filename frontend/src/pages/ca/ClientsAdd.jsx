import React from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import CreateClient from './CreateClient'

const ClientsAdd = () => {
  return (
    <DashboardLayout 
      title="Add Client" 
      subtitle="Create a new client and send them login credentials"
    >
      <CreateClient />
    </DashboardLayout>
  )
}

export default ClientsAdd