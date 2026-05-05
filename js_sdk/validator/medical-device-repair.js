const validator = {
  "device_id": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "repair_date": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "timestamp"
      }
    ]
  },
  "fault_description": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "fault_reason": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "repair_method": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "cost": {
    "rules": [
      {
        "format": "double"
      }
    ]
  },
  "repair_company": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "repair_person": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "result": {
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
          }
        ]
      }
    ],
    "defaultValue": 1
  },
  "repair_request_id": {
    "rules": [
      {
        "required": true
      },
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

const enumConverter = {}

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
