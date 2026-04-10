import { Mail, Phone } from 'lucide-react';

export default function DataAnalystFooter() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:salomeydenkyira@gmail.com';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+233240373436';
  };

  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Assistance/Enquiries Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">For Assistance/Enquiries</h3>
            
            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleEmailClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                title="Send email"
              >
                <Mail className="w-4 h-4" />
                salomeydenkyira@gmail.com
              </button>
              
              <button
                onClick={handlePhoneClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                title="Call phone number"
              >
                <Phone className="w-4 h-4" />
                0240373436
              </button>
            </div>
          </div>

          {/* Branding */}
          <div className="text-right">
            <p className="text-slate-400 text-sm">
              Pharmacy Performance Intelligence
            </p>
            <p className="text-slate-500 text-xs mt-1">
              © 2026 All rights reserved
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mt-6 pt-6">
          <p className="text-center text-slate-400 text-xs">
            Empowering pharmacy businesses with data-driven insights
          </p>
        </div>
      </div>
    </footer>
  );
}
