import {hnget, getitem} from '../lib/hn.mjs'
import {init_titles, title_keyword} from '../lib/keywords.mjs'
import {page_info} from '../lib/page-extract.mjs'
import pug from 'pug'
import fs from 'fs-extra'
import psl from 'psl'
import html2text from 'html2plaintext'

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
        // long arg
        if (arg.slice(0,2) === '--') {
            const longArg = arg.split('=');
            const longArgFlag = longArg[0].slice(2,longArg[0].length);
            const longArgValue = longArg.length > 1 ? longArg[1] : true;
            args[longArgFlag] = longArgValue;
        }
        // flags
        else if (arg[0] === '-') {
            const flags = arg.slice(1,arg.length).split('');
            flags.forEach(flag => {
            args[flag] = true;
            });
        }
    });
    return args;
}

;(async () => {

	const args = getArgs();

	const stories = []
	const jobs = []
	const source_urls=['https://hacker-news.firebaseio.com/v0/']
	const story_urls=['https://news.ycombinator.com/item?id=']
	const story_domains=['news.ycombinator.com']
	const cache_paths=['hacker-news']


	for (var i=0; i<source_urls.length; i++){
		var source_url=source_urls[i]
		var story_url=story_urls[i]
		var story_domain=story_domains[i]
		var cache_path=args[cache_paths[i]] // i.e. pass --hacker-news=hn (dirty hack but I'm not a JS dev.)

		await fs.ensureDir(`cache/${cache_path}/item`)
		await fs.ensureDir('cache/url')
		await init_titles(cache_path)
	}

	for (var i=0; i<source_urls.length; i++){
		var source_url=source_urls[i]
		var story_url=story_urls[i]
		var story_domain=story_domains[i]
		var cache_path=args[cache_paths[i]]

		console.log("Cache path: " + cache_path);

		var storyids=await hnget(source_url, 'topstories',cache_path)

		for (var storyid of (storyids).slice(0, 30)) {
			var story = await getitem(source_url, storyid, cache_path)
			if (story.type !== 'story') continue // Filter out jobs
			story.keyword = title_keyword(story.title)
			if (story.text) { // Self post
				story.url = story_url+story.id
				story.domain = story_domain
				story.paragraph = html2text(story.text.split('<p>')[0])
				story.image = false
			} else {
				story.domain = psl.parse(new URL(story.url).hostname).domain
				const info = await page_info(story.url)
				story.paragraph = info.paragraph
				story.image = info.image
			}
			stories.push(story)
		}

		const jobstories = await hnget(source_url, 'jobstories', cache_path)
		if(jobstories != null)
		{
			for (const jobid of jobstories.slice(0, 3)) {
				const job = await getitem(source_url, jobid, cache_path)
				const split = job.title.split(' ')
				const splitix = (split.findIndex(w => w.toLowerCase() === 'hiring') || 3)+1
				job.title1 = split.slice(0, splitix).join(' ')
				job.title2 = split.slice(splitix).join(' ')
				jobs.push(job)
			}
		}
	}

	await fs.writeFile('index.html', pug.renderFile('index.pug', {
		stories,
		jobs,
		date: new Intl.DateTimeFormat('en', { dateStyle: "medium", timeStyle: "medium" }).format(new Date()),
	}))
})().then(null, err => {throw err})
