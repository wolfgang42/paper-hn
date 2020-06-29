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
			.replace(/^[\[\(']+/, '')
			.replace(/['\-:,\]\)?.]+$/, '')
			.replace(/'s$/, '')
		)
		.filter(w => !/^[0-9]+$/.test(w))
		.filter(w => w)
		.filter(w => w.length > 2)
}

async function titles_file() {
	try {
		return await fs.readJson('titles.json')
	} catch (e) {
		return {}
	}
}

let tokcount
export async function init_titles() {
	tokcount = {}
	const titles = await titles_file()
	for (const storyfile of await fs.readdir('cache/hn/item/')) {
		const storyid = storyfile.split('.')[0]
		const story = await getitem(storyid)
		if (story.type !== 'story') {
			continue
		}
		titles[story.id] = story.title
		for (const ttok of tokenize(story.title)) {
			if (!(ttok in tokcount)) tokcount[ttok] = 0
			tokcount[ttok]++
		}
	}
	await fs.writeJson('titles.json', titles)
}

export function title_keyword(title) {
	const tokens = tokenize(title)
	const mincount = Math.min(...tokens.map(t => (tokcount[t] || 0)))
	return tokens.find(t => (tokcount[t] || 0) === mincount).toUpperCase()
}
