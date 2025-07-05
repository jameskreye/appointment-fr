
const EmailFallbackForm = () => {
    return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">We're not available in your area yet</h2>
          <p className="mb-4">Leave your email and we'll notify you as soon as we expand!</p>
          <input
            type="email"
            placeholder="Enter your email"
            className="border p-2 rounded w-full max-w-sm"
          />
          <button className="bg-black text-white mt-4 px-6 py-2 rounded">Notify Me</button>
        </div>
      );
}

export default EmailFallbackForm;