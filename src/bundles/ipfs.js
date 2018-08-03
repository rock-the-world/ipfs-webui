import root from 'window-or-global'
import getIpfs from 'window.ipfs-fallback'

const defaultState = {
  apiAddress: '/ip4/127.0.0.1/tcp/5001'
}

export default {
  name: 'ipfs',

  reducer (state = defaultState, {type, payload, error}) {
    if (type === 'IPFS_INIT_STARTED') {
      return { ...state, error: null }
    }

    if (type === 'IPFS_INIT_FINISHED') {
      return { ...state, ipfsReady: true, identity: payload }
    }

    if (type === 'IPFS_INIT_FAILED') {
      return { ...state, ipfsReady: false, error: error }
    }

    if (type === 'IPFS_API_UPDATED') {
      return { ...state, apiAddress: payload, error: null }
    }

    return state
  },

  persistActions: [
    'IPFS_INIT_FINISHED',
    'IPFS_API_UPDATED'
  ],

  getExtraArgs () {
    return { getIpfs: () => root.ipfs }
  },

  selectIpfsReady: state => state.ipfs.ipfsReady,

  selectIpfsApiAddress: state => state.ipfs.apiAddress,

  selectIpfsInitFailed: state => !!state.ipfs.error,

  doInitIpfs: () => async ({ dispatch, getState }) => {
    dispatch({ type: 'IPFS_INIT_STARTED' })
    const {apiAddress} = getState().ipfs
    let identity = null
    try {
      // root.ipfs needs to be set to null so getIpfs doesn't
      // use the previous connection.
      root.ipfs = null
      root.ipfs = await getIpfs({ api: true, ipfs: apiAddress })
      // will fail if remote api is not available on default port
      identity = await root.ipfs.id()
    } catch (error) {
      return dispatch({ type: 'IPFS_INIT_FAILED', error })
    }
    dispatch({ type: 'IPFS_INIT_FINISHED', payload: identity })
  },

  doUpdateIpfsAPIAddress: (apiAddress) => ({dispatch, store}) => {
    dispatch({type: 'IPFS_API_UPDATED', payload: apiAddress})
    store.doInitIpfs()
  }
}
