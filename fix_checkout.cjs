const fs = require('fs');
const content = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

let newContent = content.replace(
  "deliveryAddress: '', tableNumber:",
  "deliveryAddress: customerData?.addresses?.find(a => a.isDefault)?.fullAddress || customerData?.Address || '', tableNumber:"
);

const newBlock = `                  <AnimatePresence>
                    {formData.orderType === 'delivery' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-sm font-bold text-text-light mt-6 mb-2">{lang === 'en' ? 'Delivery Address' : 'عنوان التوصيل'} *</label>
                        
                        {/* Address Cards Selector */}
                        {customerData?.addresses?.length > 0 && (
                          <div className="mb-4 flex flex-col gap-2">
                             {customerData.addresses.map(addr => {
                               const isSelected = formData.deliveryAddress === addr.fullAddress;
                               return (
                               <label key={addr.id} className={\`p-3 rounded-xl border cursor-pointer flex gap-3 items-start transition-all \${isSelected ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}\`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value={addr.fullAddress}
                                    checked={isSelected}
                                    onChange={(e) => setFormData(prev => ({...prev, deliveryAddress: e.target.value}))}
                                    className="mt-1 shrink-0 accent-brand-red"
                                  />
                                  <div>
                                    <span className="font-bold text-text-light block">{lang === 'en' ? (addr.label === 'المنزل' ? 'Home' : addr.label === 'العمل' ? 'Work' : 'Other') : addr.label}</span>
                                    <span className="text-text-muted text-sm">{addr.fullAddress}</span>
                                  </div>
                               </label>
                             )})}
                             <label className={\`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition-all \${!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress) && formData.deliveryAddress !== '' ? 'bg-brand-red/10 border-brand-red' : 'bg-black-surface border-brand-red-dark/30 hover:border-brand-red-dark'}\`}>
                                  <input 
                                    type="radio" 
                                    name="deliveryAddressSelection"
                                    value="other"
                                    checked={!customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)}
                                    onChange={() => setFormData(prev => ({...prev, deliveryAddress: ''}))}
                                    className="shrink-0 accent-brand-red"
                                  />
                                  <span className="font-bold text-text-light">{lang === 'en' ? 'Other Address (Manual)' : 'عنوان آخر (كتابة يدوية)'}</span>
                             </label>
                          </div>
                        )}

                        {/* Fallback/Manual Textarea */}
                        {(!customerData?.addresses?.length || !customerData.addresses.some(a => a.fullAddress === formData.deliveryAddress)) && (
                          <textarea 
                            name="deliveryAddress"
                            required={formData.orderType === 'delivery'}
                            value={formData.deliveryAddress}
                            onChange={handleChange}
                            rows="2"
                            className="w-full bg-black-primary border border-brand-red-dark/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all resize-none"
                            placeholder={lang === 'en' ? 'Area, Street, Building, Floor, Apt...' : 'المنطقة، الشارع، رقم العمارة، الدور، شقة...'}
                          ></textarea>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>`;

const startTarget = "{formData.orderType === 'delivery' && (";
let firstIdx = newContent.indexOf(startTarget);
if (firstIdx !== -1) {
    let preStr = newContent.substring(0, firstIdx - 20); 
    // find nearest <AnimatePresence> before it
    let actualStart = preStr.lastIndexOf('<AnimatePresence>');
    let postStr = newContent.substring(firstIdx);
    let actualEnd = postStr.indexOf('</AnimatePresence>') + '</AnimatePresence>'.length;
    let finalStr = newContent.substring(0, actualStart) + newBlock + postStr.substring(actualEnd);
    fs.writeFileSync('src/pages/CheckoutPage.jsx', finalStr, 'utf8');
    console.log("Success fuzzy match!");
}
