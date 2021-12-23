import request from '@/utils/request'
import qs from 'qs'

export function sendJsonRequest(host, url, method, data) {
  return request({
    url: host + url,
    headers: {
      'Content-Type': 'application/json'
    },
    method,
    data
  })
}

export function sendFormRequest(host, url, method, data) {
  return request({
    url: host + url,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method,
    data: data,
    transformRequest: [data => {
      return qs.stringify(data)
    }]
  })
}
