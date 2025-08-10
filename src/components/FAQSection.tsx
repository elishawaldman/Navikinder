import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does the photo recognition work?",
      answer: "Our AI-powered image analysis technology can read medication labels, prescription bottles, and hospital discharge lists. Simply take a photo and we'll automatically extract medication names, dosages, and instructions."
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, we use enterprise-grade encryption and comply with HIPAA regulations. Your family's medical information is stored securely and never shared without your explicit consent."
    },
    {
      question: "Can multiple caregivers access the same account?",
      answer: "Absolutely! You can invite family members, babysitters, nurses, and other caregivers to access your child's medication schedule and track doses together."
    },
    {
      question: "What if I need to make changes to medications?",
      answer: "You can easily edit medication details, adjust schedules, or add new medications at any time. The app adapts to your child's changing care needs."
    },
    {
      question: "Does the app work offline?",
      answer: "Yes, core features like logging doses and viewing schedules work offline. Data syncs automatically when you reconnect to the internet."
    },
    {
      question: "How much does NaviKinder cost?",
      answer: "We're currently in development and building our waitlist. Pricing details will be announced closer to launch, with special consideration for families managing complex medical needs."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Find quick answers to the most common questions about our platform.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-background rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            Still have questions? Feel free to get in touch with us today!
          </p>
          <p className="text-lg font-medium text-brand-blue">
            support@navikinder.com
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;