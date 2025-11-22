import { getVapidPublicKey } from '../../utils/web-push'

export default eventHandler(() => {
  return { publicKey: getVapidPublicKey() }
})
