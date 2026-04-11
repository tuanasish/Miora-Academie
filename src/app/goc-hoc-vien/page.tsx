import { getPostsByCategory } from '@/app/actions/post.actions';
import { getResources } from '@/app/actions/resource.actions';
import { getTestimonials } from '@/app/actions/testimonial.actions';
import { getAchievements } from '@/app/actions/achievement.actions';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { HeroSection } from '@/components/student-hub/HeroSection';
import { BlogSection } from '@/components/student-hub/BlogSection';
import { TipsSection } from '@/components/student-hub/TipsSection';
import { ResourcesSection } from '@/components/student-hub/ResourcesSection';
import { AchievementsSection } from '@/components/student-hub/AchievementsSection';
import { TestimonialsSection } from '@/components/student-hub/TestimonialsSection';

export default async function StudentHubPage() {
  // Fetch all data in parallel
  const [blogPosts, tipsPosts, resources, testimonials, achievements] = await Promise.all([
    getPostsByCategory('blog', 3),
    getPostsByCategory('tips', 3),
    getResources(),
    getTestimonials(),
    getAchievements(),
  ]);

  return (
    <main className="min-h-screen bg-white text-[#121212]">
      <SiteHeader />
      <HeroSection />
      <BlogSection posts={blogPosts} />
      <TipsSection posts={tipsPosts} />
      <ResourcesSection resources={resources} />
      <AchievementsSection achievements={achievements} />
      <TestimonialsSection testimonials={testimonials} />
      <SiteFooter />
    </main>
  );
}
