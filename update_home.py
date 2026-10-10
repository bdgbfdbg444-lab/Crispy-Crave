import os

path = 'src/pages/Home.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import OurStory from '../components/OurStory';", "import StorySnippet from '../components/StorySnippet';")
text = text.replace("<OurStory websiteData={websiteData} />", "<StorySnippet />")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
