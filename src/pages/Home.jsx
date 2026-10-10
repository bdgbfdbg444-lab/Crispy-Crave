import React from 'react';
import Hero from '../components/Hero';
import SignatureDishes from '../components/SignatureDishes';
import CateringSection from '../components/CateringSection';
import StorySnippet from '../components/StorySnippet';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import FaqSection from '../components/FaqSection';
import SocialFeed from '../components/SocialFeed';
import LocationSection from '../components/LocationSection';
import Footer from '../components/Footer';
import PressQuote from '../components/PressQuote';
import OrderCta from '../components/OrderCta';
import Newsletter from '../components/Newsletter';
import { useEffect } from 'react';

export default function Home({ websiteData, menuData }) {
  useEffect(() => {
    // Component mounted
  }, []);

  return (
    <>
      <Hero websiteData={websiteData} />
      <PressQuote websiteData={websiteData} />
      <SignatureDishes menuData={menuData} />
      <CateringSection websiteData={websiteData} />
      <StorySnippet websiteData={websiteData} />
      <OrderCta websiteData={websiteData} />
      <Gallery websiteData={websiteData} />
      <Testimonials websiteData={websiteData} />
      <FaqSection websiteData={websiteData} />
      <SocialFeed websiteData={websiteData} />
      <Newsletter websiteData={websiteData} />
      <LocationSection websiteData={websiteData} />
      <Footer websiteData={websiteData} />
    </>
  );
}
