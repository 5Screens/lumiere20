import api from './api'

const ENDPOINT = '/tasks'

export default {
  async search(params = {}) {
    const payload = JSON.parse(JSON.stringify(params))
    const response = await api.post(`${ENDPOINT}/search`, payload)
    return response.data
  },

  async getAll(params = {}) {
    const response = await api.get(ENDPOINT, { params })
    return response.data
  },

  async getByUuid(uuid) {
    const response = await api.get(`${ENDPOINT}/${uuid}`)
    return response.data
  },

  async create(data) {
    const response = await api.post(ENDPOINT, data)
    return response.data
  },

  async update(uuid, data) {
    const response = await api.put(`${ENDPOINT}/${uuid}`, data)
    return response.data
  },

  async delete(uuid) {
    await api.delete(`${ENDPOINT}/${uuid}`)
  },

  async deleteMany(uuids) {
    const response = await api.post(`${ENDPOINT}/delete-many`, { uuids })
    return response.data
  },
}
