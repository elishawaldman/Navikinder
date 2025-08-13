// TeamSection
// Purpose: Placeholder section for the team page, indicating content is coming soon.
// Location: src/components/TeamSection.tsx
// Notes: Keeps styles consistent with the marketing sections and avoids unused imports.

const TeamSection = () => {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Team
          </h2>
          <p className="text-lg font-medium text-gray-800 italic">
            Coming soon
          </p>
        </div>

        {/* Placeholder */}
        <div className="max-w-xl mx-auto text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
            <p className="text-gray-700">
              We're putting the final touches on this section. Check back soon!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;