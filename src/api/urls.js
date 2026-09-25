const urls = {
  KEYS:{
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
  },
  auth: {
    login: '/login',
  },
  admins: {
    list: '/superadmin/admins',
    create: '/superadmin/create-admin',
  },
  wallet: {
    list: '/superadmin/wallets',
    update: '/superadmin/wallet/update',
    transactions: '/superadmin/wallet/transactions',
  },
  plans: {
    list: '/plans',
    create: '/plans',
    update: '/plans',
    delete: '/plans',
  },
  paymentRequests: {
    approve: '/payment-requests/approve',
    reject: '/payment-requests/reject',
  },
  vendorTransfers: {
    list: '/vendor/transfers',
    submit: '/vendor/transfers', // we will append /id/submit in the component
    reject: '/vendor/transfers', // we will append /id/reject in the component
    update: '/vendor/transfers', // we will append /id in the component
  }
}

export default urls