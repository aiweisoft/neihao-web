const xlsx = require('node-xlsx')

const FIELD_MAP = {
  '设备编号': 'code',
  '设备名称': 'name',
  '设备简称': 'short_name',
  '品牌': 'brand',
  '规格型号': 'model',
  '注册证号': 'spec',
  '产品编号': 'serial_no',
  '厂家': 'manufacturer',
  '设备分类': 'category_name',
  '使用部门': 'dept_name',
  '存放位置': 'location_name',
  '采购日期': 'purchase_date',
  '采购金额': 'purchase_amount',
  '供应商': 'supplier',
  '保修截止': 'warranty_end',
  '使用状态': 'status_text',
  '设备负责人': 'person_in_charge',
  '管理类型': 'management_type_text',
  '适用范围': 'applicable_scope',
  '生产日期': 'manufacture_date',
  '使用年限': 'service_life',
  '备注': 'remark'
}

const STATUS_TEXT_MAP = {
  '正常': 1,
  '使用中': 2,
  '维修中': 3,
  '报废': 4,
  '未投入': 5,
  '其他': 6
}

const MANAGEMENT_TYPE_TEXT_MAP = {
  '一类': 1,
  '二类': 2,
  '三类': 3,
  '非医疗器械': 4
}

function formatExcelDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000)
    return date.getTime()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(trimmed)) {
      return new Date(trimmed.replace(/-/g, '/')).getTime()
    }
  }
  return null
}

module.exports = {
  _before: function() {},

  async parseExcel({ fileID, fileData } = {}) {
    const db = uniCloud.database()

    let fileContent
    if (fileData) {
      try {
        fileContent = Buffer.from(fileData, 'base64')
      } catch (e) {
        return {
          code: 1,
          message: '文件数据解码失败: ' + e.message
        }
      }
    } else if (fileID) {
      try {
        const result = await uniCloud.downloadFile({ fileID })
        fileContent = result.fileContent
      } catch (e) {
        return {
          code: 1,
          message: '文件下载失败: ' + e.message
        }
      }
    } else {
      return {
        code: 1,
        message: '请提供文件数据'
      }
    }

    let sheets
    try {
      sheets = xlsx.parse(fileContent)
    } catch (e) {
      return {
        code: 2,
        message: 'Excel解析失败，请确保文件格式正确: ' + e.message
      }
    }

    if (!sheets || !sheets.length || !sheets[0].data || !sheets[0].data.length) {
      return {
        code: 3,
        message: 'Excel文件中没有数据'
      }
    }

    const sheet = sheets[0]
    const rows = sheet.data
    const headers = rows[0]

    const columnIndexMap = {}
    headers.forEach((header, index) => {
      const field = FIELD_MAP[String(header).trim()]
      if (field) {
        columnIndexMap[index] = field
      }
    })

    const recognizedFields = Object.values(columnIndexMap)
    const missingRequiredHeaders = ['code', 'name', 'brand', 'model', 'category_name', 'dept_name', 'location_name']
      .filter(f => !recognizedFields.includes(f))

    if (missingRequiredHeaders.length) {
      const missingLabels = Object.entries(FIELD_MAP)
        .filter(([, v]) => missingRequiredHeaders.includes(v))
        .map(([k]) => k)

      return {
        code: 4,
        message: '缺少必要列: ' + missingLabels.join('、')
      }
    }

    const dataRows = rows.slice(1).filter(row => row.some(cell => cell != null && cell !== ''))

    const [categoryRes, deptRes, locationRes] = await Promise.all([
      db.collection('medical-device-category').where({ deleted: 0 }).get(),
      db.collection('opendb-department').get(),
      db.collection('medical-device-location').where({ deleted: 0 }).get()
    ])

    const categoryMap = {}
    ;(categoryRes.data || categoryRes.result?.data || []).forEach(c => { categoryMap[c.name] = c._id })
    const deptMap = {}
    ;(deptRes.data || deptRes.result?.data || []).forEach(d => { deptMap[d.name] = d._id })
    const locationMap = {}
    ;(locationRes.data || locationRes.result?.data || []).forEach(l => { locationMap[l.name] = l._id })

    const errors = []
    const validRecords = []

    dataRows.forEach((row, index) => {
      const record = {}
      const excelRowNum = index + 2
      const rowErrors = []

      Object.entries(columnIndexMap).forEach(([colIdx, field]) => {
        record[field] = row[Number(colIdx)]
      })

      if (!record.code) rowErrors.push('设备编号不能为空')
      if (!record.name) rowErrors.push('设备名称不能为空')
      if (!record.brand) rowErrors.push('品牌不能为空')
      if (!record.model) rowErrors.push('规格型号不能为空')

      if (record.category_name) {
        const name = String(record.category_name).trim()
        record.category_id = categoryMap[name]
        if (!record.category_id) rowErrors.push('设备分类"' + name + '"不存在')
        delete record.category_name
      } else {
        rowErrors.push('设备分类不能为空')
      }

      if (record.dept_name) {
        const name = String(record.dept_name).trim()
        record.dept_id = deptMap[name]
        if (!record.dept_id) rowErrors.push('使用部门"' + name + '"不存在')
        delete record.dept_name
      } else {
        rowErrors.push('使用部门不能为空')
      }

      if (record.location_name) {
        const name = String(record.location_name).trim()
        record.location_id = locationMap[name]
        if (!record.location_id) rowErrors.push('存放位置"' + name + '"不存在')
        delete record.location_name
      } else {
        rowErrors.push('存放位置不能为空')
      }

      if (record.status_text) {
        const text = String(record.status_text).trim()
        record.status = STATUS_TEXT_MAP[text]
        if (record.status === undefined) rowErrors.push('使用状态"' + text + '"无效（正常/使用中/维修中/报废/未投入/其他）')
        delete record.status_text
      }

      if (record.management_type_text) {
        const text = String(record.management_type_text).trim()
        record.management_type = MANAGEMENT_TYPE_TEXT_MAP[text]
        if (record.management_type === undefined) rowErrors.push('管理类型"' + text + '"无效（一类/二类/三类/非医疗器械）')
        delete record.management_type_text
      }

      if (record.purchase_date) record.purchase_date = formatExcelDate(record.purchase_date)
      if (record.warranty_end) record.warranty_end = formatExcelDate(record.warranty_end)
      if (record.manufacture_date) record.manufacture_date = formatExcelDate(record.manufacture_date)
      if (record.purchase_amount) record.purchase_amount = Number(record.purchase_amount) || 0
      if (record.service_life) record.service_life = Number(record.service_life) || 0

      String(record.code) && (record.code = String(record.code).trim())
      String(record.name) && (record.name = String(record.name).trim())
      String(record.brand) && (record.brand = String(record.brand).trim())
      String(record.model) && (record.model = String(record.model).trim())

      if (rowErrors.length > 0) {
        errors.push({ row: excelRowNum, code: record.code || '-', message: rowErrors.join('; ') })
      } else {
        validRecords.push(record)
      }
    })

    return {
      code: 0,
      data: {
        total: dataRows.length,
        validCount: validRecords.length,
        errorCount: errors.length,
        errors: errors,
        validRecords: validRecords,
        headers: headers
          .map(h => String(h).trim())
          .filter(h => FIELD_MAP[h])
      }
    }
  },

  async confirmImport({ records }) {
    if (!records || !records.length) {
      return { code: 1, message: '没有可导入的数据' }
    }

    const db = uniCloud.database()
    const now = Date.now()

    const enrichedRecords = records.map(r => ({
      ...r,
      status: r.status || 1,
      management_type: r.management_type || 4,
      deleted: 0,
      created_at: now,
      updated_at: now
    }))

    try {
      const res = await db.collection('medical-device').add(enrichedRecords)

      return {
        code: 0,
        data: {
          insertedCount: enrichedRecords.length,
          result: res
        }
      }
    } catch (e) {
      return {
        code: 2,
        message: '导入失败: ' + e.message
      }
    }
  }
}
