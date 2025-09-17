import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AuctionCard from '@/components/molecules/auctionCard';

export default function Home(): ReactNode {
  const [latestAuctions, setLatestAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auctions/all?limit=8')
      .then((res) => res.json())
      .then((data) => {
        setLatestAuctions(data.content || data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div>
        <section className="relative">
          <img
            src="/heroImage.png"
            alt="Hero"
            className="h-screen w-full object-cover"
          />
          <div
            className="absolute inset-0 flex items-center justify-start text-white sm:p-16"
            style={{ height: 'calc(100vh - 100px)' }}
          >
            <div className="flex flex-col items-start justify-center pl-12 w-full max-w-2xl">
              <div className="self-stretch text-left">
                <span className="text-black text-3xl sm:text-5xl font-light font-['Geist'] sm:leading-[50px]">
                  Discover, Bid, and Win
                  <br />
                  with Confidence on
                  <br />
                </span>
                <span className="text-black text-7xl sm:text-8xl font-normal font-['Geist'] sm:leading-[96px]">
                  Aucti
                </span>
                <span className="text-[#eaac26] text-7xl sm:text-8xl font-normal font-['Geist'] sm:leading-[96px] text-shadow-xl text-shadow-black">
                  X
                </span>
                <span className="text-black text-7xl sm:text-8xl font-normal font-['Geist'] sm:leading-[96px]">
                  !
                </span>
              </div>
              <div className="items-center mt-6 sm:mt-8">
                <Link to="/explore-auctions">
                  <Button className="w-48">
                    Explore Auctions{' '}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 5.33333H10.6667M5.33333 8H9.33333M7.33333 10.6667H10.6667M3.33333 2H12.6667C13.403 2 14 2.59695 14 3.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333C2 2.59695 2.59695 2 3.33333 2Z"
                        stroke="#ffffffff"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto text-center px-5 py-20 pt-36">
          <div className="self-stretch text-center">
            <span className="text-slate-950 text-5xl sm:text-7xl font-bold font-['Geist'] leading-[9px]">
              Why Choose
              <br />
            </span>
            <span className="text-slate-950 text-6xl sm:text-7xl font-normal font-['Geist'] leading-[72px] sm:leading-[96px]">
              Aucti
            </span>
            <span className="text-[#ecb02d] text-6xl sm:text-7xl font-normal font-['Geist'] leading-[72px] sm:leading-[96px]">
              X
            </span>
            <span className="text-slate-950 text-6xl sm:text-7xl font-bold font-['Geist'] leading-[72px] sm:leading-[96px]">
              ?
            </span>
          </div>
          <div className="self-stretch text-center text-slate-500 text-xl sm:text-2xl font-normal pt-8 font-['Geist'] leading-normal">
            Explore the features that make us the most trusted auction platform.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 p-5 text-left">
            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Category-Based Search</h3>
                <p className="text-gray-600 text-md mt-2">
                  Find what you’re looking for with our intuitive category
                  filters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold ">Real-Time Notifications</h3>
                <p className="text-gray-600 text-md mt-2">
                  Stay updated on bids, auctions, and deals with instant alerts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Transparent Auctions</h3>
                <p className="text-gray-600 text-md mt-2">
                  Interact directly with sellers through our integrated chat
                  feature.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">Trust & Security</h3>
                <p className="text-gray-600 text-md mt-2">
                  Your transactions are safe with us. Funds are released to
                  sellers only after product delivery confirmation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="max-w-3xl mx-auto py-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 py-10">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="mt-6 px-8 space-y-2">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Are there any fees for sellers or buyers?
              </AccordionTrigger>
              <AccordionContent>
                No, there are no fees for buyers or sellers on AuctiX.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                How do I start bidding on AuctiX?
              </AccordionTrigger>
              <AccordionContent>
                Simply create an account, browse available auctions, and place
                your bid.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                What happens if I don’t receive my product?
              </AccordionTrigger>
              <AccordionContent>
                If you don’t receive your product, contact our support team for
                assistance with refunds or disputes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-center md:rounded-lg md:py-10 md:m-20"
          style={{
            backgroundImage: "url('/feedbackImage.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="w-full md:w-1/2 max-w-2xl p-8 text-left flex flex-col justify-center">
            <h2 className="text-white text-md md:text-xl mb-6">
              We value your thoughts! Your feedback is crucial in helping us
              improve and provide a better experience. Whether you have
              suggestions, compliments, or concerns, we’d love to hear from you.
            </h2>
            <Textarea
              placeholder="Type your feedback"
              className="w-full p-4 text-gray-700 bg-white rounded-md"
            />
            <Button className="mt-4 px-10 self-start">Submit</Button>
          </div>
          <div className="w-full md:w-1/2 flex items-center justify-center h-full"></div>
        </div>
      </div>
    </div>
  );
}
