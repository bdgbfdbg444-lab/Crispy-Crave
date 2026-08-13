import React from 'react';
import Hero from '../components/Hero';
import SignatureDishes from '../components/SignatureDishes';
import CateringSection from '../components/CateringSection';
import OurStory from '../components/OurStory';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import FaqSection from '../components/FaqSection';
import SocialFeed from '../components/SocialFeed';
import LocationSection from '../components/LocationSection';
import Footer from '../components/Footer';

export default function Home({ websiteData, menuData }) {
  return (
    <>
      <Hero websiteData={websiteData} />
      <SignatureDishes menuData={menuData} />
      <CateringSection websiteData={websiteData} />
      <OurStory websiteData={websiteData} />
      <Gallery websiteData={websiteData} />
      <Testimonials />
      <FaqSection />
      <SocialFeed websiteData={websiteData} />
      <LocationSection websiteData={websiteData} />
      <Footer websiteData={websiteData} />
    </>
  );
}
