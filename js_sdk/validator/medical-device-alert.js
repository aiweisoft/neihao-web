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
  "alert_type": {
    "rules": [
      {
        "required": true
      },
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
    "defaultValue": 1
  },
  "title": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "description": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "alert_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "is_read": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "defaultValue": 0
  },
  "read_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "related_id": {
    "rules": [
      {
        "format": "string"
      }
    ]
  },
  "related_type": {
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
