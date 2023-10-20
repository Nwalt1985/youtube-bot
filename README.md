# Chat-GPT prompt to generate the facts and metadata

I have a faceless youtube channel that provides educational shorts aimed at children and young adults.

can you generate me 100 interesting, engaging facts with some humour that would be suitable for my channel and that are optimised for SEO. Do not have any repeats. Lay them out in a table with the column format of

title | fact | humour | tags 

after you have displayed the table, display a json structure with the table elements in the format of { id, title, tags, desscription }. Ensure that the json objects are in the same order as the table entries. The tags will also need to include the default tags "facts", "interesting", "education", "kids", "stem", "science". The description also needs to be engaging and optimised for SEO and include these hashtags #Shorts #facts #interesting #education #kids #stem #science

Once generated put the JSON into metadata.ts

# Chat-GPT using Dall-E to generate thumbnails
Pass in the metadata JSON to Dall-E to generate the thumbnails. The thumbnails should be 1280x720 and be in the format of png.

# Chat-GPT using bing search to generate find out more links
Pass the metadata into bing search to generate the find out more links. Update the json decription to include the link.

i have this metadata for youtube videos:

(provide 5 obj at a time from metadata)

Find a website for each obj that is suitable for kids and add the text "Find out more about [the subject matter] here: [link to site]"

# Canva
Use Canva to bulk generate the videos. Videos should be 7 seconds and in mp4 format