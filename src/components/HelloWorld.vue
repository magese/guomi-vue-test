<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
  </div>

  <div class="key-container">
    <h2>加解密公私钥</h2>
    <p><label>PublicKey: </label></p>
    <p><input type="text" v-model="publicKey"></p>
    <p><label>PrivateKey: </label></p>
    <p><input type="text" v-model="privateKey"></p>
  </div>

  <div class="request-container">
    <h2>请求区域</h2>
    <p><label>请求地址：</label></p>
    <p><input type="text" v-model="requestUrl" placeholder="example: /api/rest/api/v6.1/cart"></p>
    <p><label>Content-Type：</label></p>
    <p>
      <select v-model="contentType">
        <option v-for="type in contentTypeOptions" :value="type.value" :key="type.key">{{ type.key }}</option>
      </select>
    </p>
    <p><label>请求环境：</label></p>
    <p>
      <select v-model="requestEnv">
        <option v-for="env in envOptions" :value="env.value" :key="env.key">{{ env.key }}</option>
      </select>
    </p>
    <p><label>请求方式：</label></p>
    <p>
      <select v-model="requestMethod">
        <option v-for="method in methodOptions" :value="method.value" :key="method.key">{{ method.key }}</option>
      </select>
    </p>
    <p><label>请求内容：</label></p>
    <p v-if="contentType === 'form'"><input type="text" v-model="requestBody" placeholder="example: channel=1&type=0&count=20"></p>
    <p v-if="contentType === 'json'"><textarea v-model="requestBody" placeholder="example: {channel: 1, type: 0, count: 20}"></textarea></p>
    <p v-if="showEncrypt"><label>加密请求：</label></p>
    <p v-if="showEncrypt"><json-viewer :value="encryptData" expand-depth="5" copyable boxed></json-viewer></p>
    <p v-if="showEncrypt"><button @click="resetEncrypt">重置</button></p>
    <p>
      <button @click="encrypt">加密报文</button>
      <button @click="sendRequest(false)">发送请求</button>
      <button v-if="showEncrypt" @click="sendRequest(true)">发送加密请求</button>
    </p>
  </div>

  <div class="response-container">
    <h2>响应区域</h2>
    <p><label>响应内容：</label></p>
    <p><json-viewer :value="response" expand-depth="5" copyable boxed></json-viewer></p>
    <p><button @click="decrypt">解密报文</button></p>
    <p v-if="showDecrypt"><label>解密内容：</label></p>
    <p v-if="showDecrypt"><json-viewer :value="decryptData" expand-depth="5" copyable boxed></json-viewer></p>
    <p v-if="showDecrypt"><button @click="resetDecrypt">重置</button></p>
  </div>
</template>

<script>
import { sendFormRequest, sendJsonRequest } from '@/api'
import { sm2 } from 'sm-crypto'
import { JsonViewer } from 'vue-json-viewer/ssr'
import qs from 'qs'

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      prefix: '04',
      publicKey: 'F48E0C3937F7CB56088D6E0D1A4A18318DFC7FC67E6F0A30C1B25E7D811D8156A022A695E31EC79C489E3AAEE3FEC2A11460AB275CFDAAF08C6E8E6E17F500B9',
      privateKey: '36E6DB9BC7C19BE099AA9D499488CCE9928C3EFA537BE621F1F3EF265A35DB8C',
      requestUrl: '',
      contentType: 'form',
      contentTypeOptions: [
        { key: 'application/x-www-form-urlencoded', value: 'form' },
        { key: 'application/json', value: 'json' }
      ],
      requestEnv: 'http://11.221.161.13:8084',
      envOptions: [
        { key: 'DEV', value: 'http://11.221.161.13:8084' },
        { key: 'SIT', value: 'http://11.215.122.3:8084' },
        { key: 'UAT', value: 'http://11.215.122.81:8084' },
        { key: 'PRE', value: 'http://11.215.122.205:8084' },
        { key: 'LOCAL', value: 'http://127.0.0.1:8084' }
      ],
      requestMethod: 'get',
      methodOptions: [
        { key: 'GET', value: 'get' },
        { key: 'POST', value: 'post' },
        { key: 'PUT', value: 'put' },
        { key: 'DELETE', value: 'delete' }
      ],
      requestBody: '',
      response: undefined,
      decryptData: '',
      encryptData: '',
      showDecrypt: false,
      showEncrypt: false,
      cipherMode: 1 // 1 - C1C3C2，0 - C1C2C3，默认为1
    }
  },
  methods: {
    sendRequest(encrypt) {
      if(this.contentType === 'form') {
        this.formRequest(encrypt)
      } else if (this.contentType === 'json') {
        this.jsonRequest(encrypt)
      } else {
        alert(`未知的 Content-Type 类型:${this.contentType}`)
      }
    },
    formRequest(encrypt) {
      let request = ''
      if(this.requestBody) {
        if(encrypt) {
          request = 'data=' + this.encryptData;
        } else {
          request = this.requestBody
        }
      }
      sendFormRequest(this.requestEnv, this.requestUrl, this.requestMethod, qs.parse(request)).then(({ data }) => {
        this.response = data
      }).catch(e => {
        console.error(e)
        this.response = undefined
        alert(e)
      })
    },
    jsonRequest(encrypt) {
      let request = {}
      if(this.requestBody) {
        if(!this.checkBody()) return
        if(encrypt) {
          request.data = this.encryptData;
        } else {
          request = JSON.parse(this.requestBody)
        }
      }
      sendJsonRequest(this.requestEnv, this.requestUrl, this.requestMethod, request).then(({ data }) => {
        this.response = data
      }).catch(e => {
        console.error(e)
        this.response.data = undefined
        alert(e)
      })
    },
    checkBody() {
      try {
        JSON.parse(this.requestBody)
        return true
      } catch(e) {
        alert('请求体必须为JSON格式')
        return false
      }
    },
    decrypt() {
      if(!this.response.data) {
        alert('没有加密的内容')
        return
      }
      const encryptData = this.response.data.toLowerCase()
      let decryptData = sm2.doDecrypt(encryptData, this.privateKey, this.cipherMode)
      this.decryptData = JSON.parse(decryptData)
      this.showDecrypt = true
    },
    encrypt() {
      const publicKey = this.prefix + this.publicKey
      this.encryptData = sm2.doEncrypt(this.requestBody, publicKey, this.cipherMode).toUpperCase()
      this.showEncrypt = true
    },
    resetEncrypt() {
      this.showEncrypt = false
      this.encryptData = ''
    },
    resetDecrypt() {
      this.showDecrypt = false
      this.decryptData = ''
    }
  },
  components: { JsonViewer }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h2 {
  font-size: 18px;
}
.key-container {
  font-size: 14px;
  width: 500px;
  margin: 40px auto 20px;
}
.request-container {
  height: auto;
  width: 500px;
  margin: 50px auto;
}
.response-container {
  height: auto;
  width: 500px;
  margin: 50px auto;
}
.request-container p, .response-container p, .key-container p {
  text-align: left;
}
.request-container label, .response-container label {
  font-size: 16px;
}
.request-container input, .key-container input {
  height: 22px;
  width: 100%;
}
.request-container select {
  height: 26px;
  width: 250px;
}
.request-container textarea {
  height: 100px;
  width: 100%;
  resize: none;
}
.response-container textarea {
  height: 150px;
  width: 100%;
  resize: none;
}
textarea:read-only {
  background: #f3f3f3;
}
button {
  background: #364a5f;
  color: #fff;
  font-weight: bold;
  border: none;
  padding: 7px 15px;
  border-radius: 4px;
  margin-right: 20px;
}
</style>
