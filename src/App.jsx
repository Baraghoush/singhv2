import React from 'react';

function App() {
  // Example condition: change this to your actual logic
  const useSingh = true; // Set to false to use "Singh Law Group"

  const lawFirmName = useSingh ? "Singh Law" : "Singh Law Group";

  return (
    <div className="font-sans bg-white text-gray-900">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Singh Law Group</h1>
        <p className="text-xl mb-6">Personal, business, and family legal services in British Columbia</p>
        <a href="#contact" className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl shadow hover:bg-blue-100 transition">
          Book a Consultation
        </a>
      </section>

      {/* About Section */}
      <section className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">About Singh Law Group</h2>
        <p className="mb-4">
          Singh Law Group offers comprehensive legal support for individuals, families, and businesses. With a focus on results, integrity, and accessible service, we guide you through real estate, wills, immigration, corporate law, and more.
        </p>
      </section>

      {/* Practice Areas */}
      <section className="bg-gray-50 py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Practice Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Family Law</h3>
            <p>Agreements, separation, and parenting arrangements.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Immigration Law</h3>
            <p>Permanent residency, sponsorship, and visa applications.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Business Law</h3>
            <p>Incorporations, contracts, shareholder agreements, and advice for entrepreneurs.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Real Estate Law</h3>
            <p>Buying, selling, or refinancing homes and properties.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold mb-2">Wills & Estates</h3>
            <p>Wills, powers of attorney, estate administration, and planning.</p>
          </div>
        </div>
      </section>

      {/* Attorney Bio */}
      <section className="max-w-4xl mx-auto py-12 px-4 flex flex-col md:flex-row items-center gap-8">
        <img
          src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?fit=facearea&w=300&h=300&q=80"
          alt="Attorney"
          className="rounded-full w-48 h-48 object-cover shadow"
        />
        <div>
          <h2 className="text-2xl font-bold mb-2">Sumandeep Singh, Lawyer</h2>
          <p>
            Sumandeep Singh and his team are dedicated to delivering high-quality legal solutions with a client-first approach. With years of experience across multiple practice areas, Sumandeep is committed to providing clear guidance and strong advocacy for every client.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="bg-blue-900 text-white py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-6">Contact</h2>
        <form className="max-w-lg mx-auto flex flex-col gap-4" action="https://formspree.io/f/mzbqgrnl" method="POST">
          <input className="p-3 rounded" type="text" name="name" placeholder="Your Name" required />
          <input className="p-3 rounded" type="email" name="email" placeholder="Your Email" required />
          <textarea className="p-3 rounded" name="message" placeholder="Your Message" rows={5} required></textarea>
          <button className="bg-white text-blue-900 font-bold py-3 rounded-xl shadow hover:bg-blue-100 transition" type="submit">
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 px-4 text-center text-sm text-gray-500">
        <div>
          Address: 8138 128 St Ste 242, Surrey, BC V3W 1R1<br/>
          Phone: (604) 503-6161 | info@singhlawgroup.com
        </div>
        <div className="mt-2">
          &copy; 2025 Singh Law Group LLC. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;