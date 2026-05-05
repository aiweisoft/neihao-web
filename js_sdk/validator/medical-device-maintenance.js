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
  "plan_name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ]
  },
  "maintenance_type": {
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
          }
        ]
      }
    ],
    "defaultValue": 1
  },
  "plan_date": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "timestamp"
      }
    ]
  },
  "cycle_type": {
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
    ]
  },
  "cycle_value": {
    "rules": [
      {
        "format": "int"
      }
    ]
  },
  "next_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ]
  },
  "remind_before_days": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "defaultValue": 7
  },
  "description": {
    "rules": [
      {
        "format": "string"
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
  "completed_date": {
    "rules": [
      {
        "format": "timestamp"
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
