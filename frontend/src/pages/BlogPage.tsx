import Navbar from '../components/landing/Navbar';
import BlogHeader from '../components/blog/BlogHeader';
import BlogFeaturedPost from '../components/blog/BlogFeaturedPost';
import BlogArchiveSection from '../components/blog/BlogArchiveSection';
import Footer from '../components/landing/Footer';

export default function BlogPage() {
  return (
    <main>
      <Navbar />
      <div style={{ paddingTop: 64 }}>
        <BlogHeader />
        <BlogFeaturedPost />
        <BlogArchiveSection />
        <Footer />
      </div>
    </main>
  );
}
