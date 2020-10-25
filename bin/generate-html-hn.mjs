import{hnget, getitem} from '../lib/hn.mjs' import{
    init_titles, title_keyword} from '../lib/keywords.mjs' import{
    page_info} from '../lib/page-extract.mjs' import pug from 'pug' import fs
    from 'fs-extra' import psl from 'psl' import html2text from 'html2plaintext'

    ;
(async() =
     >
     {
       await fs.ensureDir('cache/hn/item') await fs.ensureDir('cache/url')

           await
           init_titles()

               const stories = [] const source =
           'https://hacker-news.firebaseio.com/v0/' for (const storyid of(
                                                             await hnget(
                                                                 source,
                                                                 'topstories'))
                                                             .slice(0, 30)) {
         const story =
             await getitem(source,
                           storyid) if (story.type !=
                                        = 'story') continue  // Filter out jobs
             story.keyword =
                 title_keyword(story.title) if (story.text) {  // Self post
           story.url =
               'https://news.ycombinator.com/item?id=' + story.id story.domain =
                   'news.ycombinator.com' story.paragraph =
                       html2text(story.text.split('<p>')[0]) story.image = false
         }
         else {story.domain =
                   psl.parse(new URL(story.url).hostname).domain const info =
                       await page_info(story.url) story.paragraph =
                           info.paragraph story.image =
                               info.image} stories.push(story)
       }

       const jobstories = await hnget(source_url, 'jobstories',
                                      cache_path) if (jobstories != null) {
         for (const jobid of jobstories.slice(0, 3)) {
           const job = await getitem(source_url, jobid, cache_path)
               const split = job.title.split(' ') const splitix =
                   (split.findIndex(w = > w.toLowerCase() == = 'hiring') || 3) +
                   1 job.title1 = split.slice(0, splitix).join(' ') job.title2 =
                       split.slice(splitix).join(' ') jobs.push(job)
         }
       }

       await fs.writeFile('index.html', pug.renderFile('index.pug', {
         stories,
         jobs,
         date : new Date(1000 * Math.max(... stories.map(s = > s.time)))
             .toLocaleString('en-US', {
               timeZone : 'UTC',
               dateStyle : 'full',
               timeStyle : 'short',
               timeZoneName : 'short',
             }),
       }))
     })()
    .then(null, err = > {throw err})
