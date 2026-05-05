// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "code": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "short_name": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "manufacturer": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "brand": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "model": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "spec": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "serial_no": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "category_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "dept_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "location_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "purchase_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "purchase_amount": {
    "rules": [
      {
        "format": "double"
      }
    ]
  },
  "supplier": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "warranty_end": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "status": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 1,
            "text": 1
          },
          {
            "value": 2,
            "text": 2
          },
          {
            "value": 3,
            "text": 3
          },
          {
            "value": 4,
            "text": 4
          },
          {
            "value": 5,
            "text": 5
          },
          {
            "value": 6,
            "text": 6
          }
        ]
      }
    ],
    "defaultValue": 1
  },
  "person_in_charge": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "management_type": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 1,
            "text": "1"
          },
          {
            "value": 2,
            "text": "2"
          },
          {
            "value": 3,
            "text": "3"
          },
          {
            "value": 4,
            "text": "4"
          }
        ]
      }
    ],
    "defaultValue": 4
  },
  "applicable_scope": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "manufacture_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "service_life": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "image_url": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "remark": {
    "rules": [
      {
        "format": "string"
      }
    ]
  }
}

const enumConverter = {
  "status_valuetotext": {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4
  }
}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
    switch (type) {
      case "search":
        if (typeof value === 'string' && value.length) {
          where[field] = new RegExp(value)
        }
        break;
      case "select":
        if (value.length) {
          let selectValue = []
          for (let s of value) {
            selectValue.push(command.eq(s))
          }
          where[field] = command.or(selectValue)
        }
        break;
      case "range":
        if (value.length) {
          let gt = value[0]
          let lt = value[1]
          where[field] = command.and([command.gte(gt), command.lte(lt)])
        }
        break;
      case "date":
        if (value.length) {
          let [s, e] = value
          let startDate = new Date(s)
          let endDate = new Date(e)
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
      case "timestamp":
        if (value.length) {
          let [startDate, endDate] = value
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
    }
  }
  return where
}

export { validator, enumConverter, filterToWhere }
