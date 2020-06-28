import {hnget, getitem} from './hn.mjs'
import fs from 'fs-extra'
import compare from 'compare-function'

function tokenize(title) {
	return title.toLowerCase()
		.replace(/^Show HN:/i, '')
		.replace(/^Ask HN:/i, '')
		.replace(/[‘’]/g, "'")
		.replace(/[“”]/g, '')
		.replace(/[–]/g, '-')
		.split(' ')
		.map(w => w.trim())
		.filter(w => !/^\([0-9]{4}\)$/.test(w)) // (year)
		.filter(w => !['[pdf]', '[video]'].includes(w))
		.map(w => w
			.replace(/^[\[\(']/, '')
			.replace(/['\-:,\]\)?.]$/, '')
			.replace(/'s$/, '')
		)
		.filter(w => w)
		.filter(w => w.length > 2)
}

let tokcount
export async function init_titles() {
	tokcount = {}
	for (const storyfile of await fs.readdir('cache/hn/item/')) {
		const storyid = storyfile.split('.')[0]
		const story = await getitem(storyid)
		if (story.type !== 'story') {
			continue
		}
		for (const ttok of tokenize(story.title)) {
			if (!(ttok in tokcount)) tokcount[ttok] = 0
			tokcount[ttok]++
		}
	}
}

export function title_keyword(title) {
	const tokens = tokenize(title)
	const mincount = Math.min(...tokens.map(t => tokcount[t]))
	return tokens.find(t => tokcount[t] === mincount).toUpperCase()
}
