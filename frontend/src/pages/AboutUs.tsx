import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center py-16 px-4 mb-8">
        <img
          src="/logo.png"
          alt="AuctiX Logo"
          className="w-48 h-48 object-contain "
        />

        <p className="text-xl text-gray-600 max-w-2xl text-center mb-6">
          The next generation auction platform. Discover, bid, and win unique
          items in a secure and vibrant marketplace.
        </p>
        <a
          href="mailto:support@auctix.com"
          className="inline-block bg-primary text-white px-6 py-2 rounded-full font-semibold shadow hover:bg-primary/90 transition"
        >
          Contact Us
        </a>
      </section>

      {/* Team Section Placeholder */}
      <section className="max-w-full mx-auto px-4 pb-16">
        <Card className="bg-white border-0 shadow-none rounded-2xl">
          <CardContent className="p-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 text-center mb-2">
              Our passionate team is dedicated to building the best auction
              experience for you.
            </p>
            {/* Add team members here if desired */}
            <div className="flex flex-wrap gap-10 mt-6 justify-center">
              {[
                {
                  name: 'Tharin Edirisinghe',
                  role: 'Leader',
                },
                {
                  name: 'Sachintha Lakmin',
                  role: 'Member',
                },
                {
                  name: 'Sakindu Ransindu',
                  role: 'Member',
                },
                {
                  name: 'Chamodi Senanayake',
                  role: 'Member',
                },
                {
                  name: 'Garuka Satharasinghe',
                  role: 'Member',
                },
              ].map((member, idx) => (
                <div key={idx} className="flex flex-col items-center w-48">
                  <img
                    src="/defaultProfilePhoto.jpg"
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover bg-gray-200 mb-2"
                  />
                  <div className="text-base font-semibold text-gray-800">
                    {member.name}
                  </div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AboutUs;
