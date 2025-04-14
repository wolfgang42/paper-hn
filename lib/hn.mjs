import fetch from 'node-fetch'
import fs from 'fs-extra'

export async function hnget(source, q, cache_path) {
	const cache = `cache/${cache_path}/${q}.json`
	if (await fs.exists(cache)) {
		return fs.readJson(cache)
	}
	const url = `${source}${q}.json`
	
	const res = await fetch(url)
	if (!res.ok)
	{
		throw new Error(`HTTP error: ${res.status} for ${source}${q}.json`)
	}
	const ret = await res.json()
	await fs.writeJson(cache, ret)
	return ret
}

export async function getitem(source,itemid, cache_path) {
	return await hnget(source,`item/${itemid}`, cache_path)
}
