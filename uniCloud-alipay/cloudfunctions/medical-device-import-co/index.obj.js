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
  },

  async seedAll() {
    const db = uniCloud.database()
    const now = Date.now()
    const results = {}

    try {
      const catCount = await db.collection('medical-device-category').count()
      if (catCount.total === 0) {
        await db.collection('medical-device-category').add([
          { code: '01', name: '监护设备', parent_id: '', sort: 10, remark: '生命体征监护类设备' },
          { code: '02', name: '影像设备', parent_id: '', sort: 20 },
          { code: '03', name: '检验设备', parent_id: '', sort: 30 },
          { code: '04', name: '治疗设备', parent_id: '', sort: 40 },
          { code: '05', name: '诊断设备', parent_id: '', sort: 50 },
          { code: '0101', name: '多参数监护仪', parent_id: '', sort: 11 },
          { code: '0201', name: '超声诊断仪', parent_id: '', sort: 21 },
          { code: '0301', name: '生化分析仪', parent_id: '', sort: 31 },
          { code: '0202', name: 'X射线设备', parent_id: '', sort: 22 },
          { code: '0501', name: '心电图机', parent_id: '', sort: 51 }
        ])
        results.categories = 'inserted'
      } else {
        results.categories = 'already_exists'
      }
    } catch (e) { results.categories = e.message }

    try {
      const locCount = await db.collection('medical-device-location').count()
      if (locCount.total === 0) {
        await db.collection('medical-device-location').add([
          { code: 'ICU-01', name: 'ICU监护室1号位', building: '住院部', floor: '3楼', room: '301' },
          { code: 'ER-01', name: '急诊科超声室', building: '急诊楼', floor: '1楼', room: '105' },
          { code: 'LAB-01', name: '检验科生化室', building: '医技楼', floor: '2楼', room: '208' },
          { code: 'RAD-01', name: '放射科DR室', building: '医技楼', floor: '1楼', room: '101' },
          { code: 'CARD-01', name: '心内科心电图室', building: '门诊楼', floor: '2楼', room: '210' }
        ])
        results.locations = 'inserted'
      } else {
        results.locations = 'already_exists'
      }
    } catch (e) { results.locations = e.message }

    try {
      const devCount = await db.collection('medical-device').where({ deleted: 0 }).count()
      if (devCount.total === 0) {
        await db.collection('medical-device').add([
          { code: 'MED-20230001', name: '多参数监护仪', brand: '迈瑞', model: 'BeneVision N22', status: 1, management_type: 2, deleted: 0, created_at: now, updated_at: now },
          { code: 'MED-20230002', name: '便携式超声诊断仪', brand: 'GE', model: 'Vivid iq', status: 2, management_type: 2, deleted: 0, created_at: now, updated_at: now },
          { code: 'MED-20230003', name: '全自动生化分析仪', brand: '罗氏', model: 'Cobas c702', status: 1, management_type: 1, deleted: 0, created_at: now, updated_at: now },
          { code: 'MED-20230004', name: '数字化X射线摄影系统', brand: '西门子', model: 'Ysio Max', status: 3, management_type: 2, deleted: 0, created_at: now, updated_at: now },
          { code: 'MED-20220001', name: '心电图机', brand: '福田', model: 'FX-7402', status: 4, management_type: 1, deleted: 0, created_at: now, updated_at: now }
        ])
        results.devices = 'inserted'
      } else {
        results.devices = 'already_exists'
      }
    } catch (e) { results.devices = e.message }

    try {
      const alertCount = await db.collection('medical-device-alert').count()
      if (alertCount.total === 0) {
        await db.collection('medical-device-alert').add([
          { title: '多参数监护仪保养到期', description: '设备 MED-20230001 距离上次保养已超6个月', alert_type: 1, is_read: 0, alert_date: now - 86400000 },
          { title: 'DR设备维修进度更新', description: '数字化X射线摄影系统维修已完成，请验收', alert_type: 2, is_read: 0, alert_date: now - 172800000 },
          { title: '生化分析仪校准提醒', description: '全自动生化分析仪校准证书将于15天后到期', alert_type: 2, is_read: 0, alert_date: now - 259200000 },
          { title: '心电图机报废确认', description: '心电图机 MED-20220001 已标记报废', alert_type: 4, is_read: 0, alert_date: now - 345600000 }
        ])
        results.alerts = 'inserted'
      } else {
        results.alerts = 'already_exists'
      }
    } catch (e) { results.alerts = e.message }

    return { code: 0, data: results }
  }
}
