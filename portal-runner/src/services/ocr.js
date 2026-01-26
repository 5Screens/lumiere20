import api from './api'

/**
 * Process a document with OCR
 * @param {File} file - File to process
 * @returns {Promise<Object>} OCR result with markdown content
 */
export const processOcr = async (file) => {
  try {
    // Convert file to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const response = await api.post('/agent/ocr', {
      documentBase64: base64,
      mimeType: file.type,
      options: {
        tableFormat: 'markdown'
      }
    })
    
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'OCR processing failed'
    throw new Error(errorMessage)
  }
}

/**
 * Save an OCR document to the database
 * @param {Object} data - Document data
 * @param {string} data.originalName - Original file name
 * @param {string} data.mimeType - MIME type
 * @param {number} data.fileSize - File size in bytes
 * @param {string} data.markdown - Extracted markdown content
 * @param {number} data.pageCount - Number of pages
 * @returns {Promise<Object>} Saved document
 */
export const saveOcrDocument = async (data) => {
  try {
    const response = await api.post('/ocr-documents', data)
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to save document'
    throw new Error(errorMessage)
  }
}

/**
 * Get all OCR documents for the current user
 * @returns {Promise<Array>} List of OCR documents
 */
export const getOcrDocuments = async () => {
  try {
    const response = await api.get('/ocr-documents')
    return response.data?.data || response.data || []
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to get documents'
    throw new Error(errorMessage)
  }
}

/**
 * Get a specific OCR document by UUID
 * @param {string} uuid - Document UUID
 * @returns {Promise<Object>} Document with markdown content
 */
export const getOcrDocument = async (uuid) => {
  try {
    const response = await api.get(`/ocr-documents/${uuid}`)
    return response.data?.data || response.data || null
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to get document'
    throw new Error(errorMessage)
  }
}

/**
 * Delete an OCR document
 * @param {string} uuid - Document UUID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteOcrDocument = async (uuid) => {
  try {
    await api.delete(`/ocr-documents/${uuid}`)
    return true
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to delete document'
    throw new Error(errorMessage)
  }
}

export default {
  processOcr,
  saveOcrDocument,
  getOcrDocuments,
  getOcrDocument,
  deleteOcrDocument
}
