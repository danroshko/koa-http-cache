class RedisMock {
  constructor () {
    this.data = new Map()
  }

  async hmset (key, ...args) {
    const hash = {}

    for (let i = 0; i < args.length; i += 2) {
      hash[args[i]] = args[i + 1]
    }

    this.data.set(key, hash)
  }

  async hget (key, field) {
    const hash = this.data.get(key) || {}
    return hash[field]
  }

  async del (key) {
    this.data.delete(key)
  }

  async expire (key, s) {
    setTimeout(() => this.data.delete(key), s * 1000)
  }
}

module.exports = RedisMock
