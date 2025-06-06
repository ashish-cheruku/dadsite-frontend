import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Developer = () => {
  return (
    <div className="min-h-screen bg-[#1B1B1B] text-white">
      <Navbar />
      
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-[#362222] to-[#423F3E] flex items-center justify-center text-4xl font-bold mb-4">
                AK
              </div>
              <h1 className="text-4xl font-bold mb-2">Ashish K Cheruku</h1>
              <p className="text-lg text-gray-400">Karimnagar, Telangana, India</p>
            </div>
            
            {/* Social Links */}
            <div className="flex justify-center space-x-6 mb-8">
              <a 
                href="https://github.com/ashish-cheruku" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-[#2B2B2B] px-4 py-2 rounded-lg hover:bg-[#362222] transition-colors border border-[#423F3E]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              
              <a 
                href="https://www.linkedin.com/in/ashish-k-cheruku/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-[#2B2B2B] px-4 py-2 rounded-lg hover:bg-[#362222] transition-colors border border-[#423F3E]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              
              <a 
                href="https://x.com/Ashish_Cheruku" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-[#2B2B2B] px-4 py-2 rounded-lg hover:bg-[#362222] transition-colors border border-[#423F3E]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>

          {/* About Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">About</h2>
            <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
              <p className="text-gray-300 leading-relaxed">
                I am currently a student at the Birla Institute of Technology and Science, Pilani, pursuing MSc Economics and BE Manufacturing and DevOps Engineer at Smarttrak AI. I am proficient in cloud infrastructure, automation, and CI/CD pipelines 
                using Microsoft Azure and AWS platforms ,Python, JavaScript/TypeScript, and backend frameworks like Node.js, 
                Express.js, and FastAPI, with extensive database experience including MongoDB, PostgreSQL, MySQL, and SQLite. My frontend development 
                skills include React.js, Next.js, and TailwindCSS. I specialize in cloud DevOps practices, scalable backend system design, security 
                implementation additionally fine-tuning large language models (LLMs) for improved efficiency and accuracy. I am passionate about automating 
                workflows and building robust, performant applications that meet modern business requirements.
              </p>
            </div>
          </div>



          {/* Education Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Education</h2>
            <div className="space-y-6">
              
              <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#362222] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">BI</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">Birla Institute of Technology and Science, Pilani</h3>
                    <p className="text-sm text-gray-500">Oct 2021 - May 2026</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#362222] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">SC</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">Sri Chaitanya College of Education</h3>
                    <p className="text-gray-400 mb-2">Intermediate education (11th & 12th)</p>
                    <p className="text-sm text-gray-500">Aug 2019 - Aug 2021</p>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Back to Home */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Developer; 