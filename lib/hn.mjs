import fetch from 'node-fetch'
import fs from 'fs-extra'

export async function hnget(q) {
	const cache = `cache/hn/${q}.json`
	if (await fs.exists(cache)) {
		return fs.readJson(cache)
	}
	const res = await fetch(`https://hacker-news.firebaseio.com/v0/${q}.json`)
	if (!res.ok) {
		throw new Error(`HTTP error: ${res.status} for ${q}`)
	}
	const ret = await res.json()
	await fs.writeJson(cache, ret)
	return ret
}

export async function getitem(itemid) {
	return await hnget(`item/${itemid}`)
}
