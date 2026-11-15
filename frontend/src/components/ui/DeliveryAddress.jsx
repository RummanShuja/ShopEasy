export function DeliveryAddress({ address }) {
  return (
    <address className="address-lines">
      <span>{address.line1}</span>
      {address.line2 && <span>{address.line2}</span>}
      <span>{[address.city, address.state, address.postalCode].join(', ')}</span>
      <span>{address.country}</span>
    </address>
  );
}
