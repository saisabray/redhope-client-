"use client";

import React, { useState } from "react";
import { Input, TextArea, Button, Card, Separator } from "@heroui/react";
import { Mail, MapPin, Send, MessageCircle } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const myWhatsAppNumber = "+8801999999999"; 
  const myEmail = "redhope.blood@gmail.com";

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const sendEmail = (e) => {
    e.preventDefault();

    const mailtoLink =
      `mailto:${myEmail}` +
      `?subject=${encodeURIComponent(formData.subject || "Contact")}` +
      `&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;

    window.location.href = mailtoLink;
  };

  const openWhatsApp = () => {
    const text = `Hello, my name is ${formData.name}. ${formData.message}`;
    const url = `https://wa.me/${myWhatsAppNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const inputStyle =
    "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-red-500";

  return (
    <section className="py-20 bg-slate-950 text-slate-100">
      <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto px-6">

        {/* LEFT */}
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white">
            Start a <span className="text-red-500">Conversation</span>
          </h2>

          <p className="text-slate-400">
            Contact us through email or WhatsApp anytime.
          </p>

          <Separator className="bg-slate-800" />

          <Card className="bg-slate-900 border border-slate-800">
            <Card.Header>
              <h3 className="text-lg font-semibold text-white">Contact Info</h3>
              <p className="text-sm text-slate-400">
                Reach out via email or location details below
              </p>
            </Card.Header>

            <Card.Content className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="text-red-500" />
                <div>
                  <p className="text-xs uppercase text-slate-500">Email</p>
                  <p className="text-slate-200">{myEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <MapPin className="text-red-500" />
                <div>
                  <p className="text-xs uppercase text-slate-500">Location</p>
                  <p className="text-slate-200">Dhaka, Bangladesh</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* RIGHT */}
        <Card className="bg-slate-900 border border-slate-800">
          <Card.Header>
            <h3 className="text-lg font-semibold text-white">Send Message</h3>
            <p className="text-sm text-slate-400">
              Fill out the form and We’ll get back to you soon
            </p>
          </Card.Header>

          <Card.Content className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                id="name"
                placeholder="Enter us your name"
                value={formData.name}
                onChange={handleChange}
                className={inputStyle}
              />

              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                className={inputStyle}
              />
            </div>

            <Input
              id="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              className={inputStyle}
            />

            <TextArea
              id="message"
              placeholder="Share your message..."
              value={formData.message}
              onChange={handleChange}
              className={`${inputStyle} h-32`}
            />
          </Card.Content>

          <Card.Footer className="flex flex-col sm:flex-row gap-3">
            <Button
              color="danger"
              startContent={<Send size={18} />}
              className="flex-1 font-semibold"
              onClick={sendEmail}
            >
              Send Email
            </Button>

            <Button
              color="success"
              startContent={<MessageCircle size={18} />}
              className="flex-1 font-semibold text-white"
              onClick={openWhatsApp}
            >
              WhatsApp
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </section>
  );
};

export default Contact;