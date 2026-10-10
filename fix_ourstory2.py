import os

path = 'src/pages/OurStoryPage.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix link
text = text.replace('to="/#menu"', 'to="/menu"')

# Add bRollUrl
import_fix = """  const bRollUrl = websiteData?.bRollVideoUrl;
  const smokeImg = websiteData?.storyPageSmokeImage || websiteData?.signatureDishImageUrl || 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';"""

text = text.replace("  const smokeImg = websiteData?.storyPageSmokeImage || 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';", import_fix)

# Replace the img tag in smoke section with video if bRollUrl exists
old_img = """              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <img src={smokeImg} alt={smokeTitle} className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700" />
              </div>"""

new_media = """              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative h-[500px]">
                {bRollUrl ? (
                  <video 
                    src={bRollUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <img src={smokeImg} alt={smokeTitle} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                )}
              </div>"""

text = text.replace(old_img, new_media)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
