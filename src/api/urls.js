const urls = {
  KEYS:{
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    PATCH: 'patch',
    DELETE: 'delete',
  },
  auth: {
    login: '/login',
    profile: '/profile',
    updateProfile: '/user/update_profile',
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
  vendor: {
    summary: '/vendor/summary',
    wallets: {
      balances: (paymentMethodId) => `/vendor/wallets/${paymentMethodId}/balances`,
      transactions: (paymentMethodId) => `/vendor/wallets/${paymentMethodId}/transactions`,
      credit: (paymentMethodId) => `/vendor/wallets/${paymentMethodId}/credit`,
    },
  },
  vendorTransfers: {
    list: '/vendor/transfers',
    summary: '/vendor/summary',
    submit: '/vendor/transfers', // we will append /id/submit in the component
    reject: '/vendor/transfers', // we will append /id/reject in the component
    update: '/vendor/transfers', // we will append /id in the component
  }
}

export default urls