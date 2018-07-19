// redis mock
const data = {}

exports.hmset = async (key, ...args) => {
  const hash = {}

  for (let i = 0; i < args.length; i += 2) {
    hash[args[i]] = args[i + 1]
  }

  data[key] = hash
}

exports.hget = async (key, field) => {
  const hash = data[key] || {}
  return hash[field]
}

exports.del = async key => {
  data[key] = null
}

exports.expire = async (key, s) => {
  setTimeout(() => {
    data[key] = null
  }, s * 1000)
}
