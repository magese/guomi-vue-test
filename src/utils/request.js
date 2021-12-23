import axios from 'axios'

const service = axios.create({
  timeout: 6000
})

export default service
