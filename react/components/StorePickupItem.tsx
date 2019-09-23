import React, { FC } from 'react'
import TranslateEstimate from 'vtex.shipping-estimate-translator/TranslateEstimate'
import { FormattedMessage } from 'react-intl'

interface Props {
  location: SkuPickupLocation
}

const StorePickupItem: FC<Props> = ({ location }) => {
  const { pickupStoreInfo: { address, friendlyName }, shippingEstimate } = location
  const estimate = shippingEstimate && <TranslateEstimate shippingEstimate={shippingEstimate} isPickup />
  return (
    <div className="flex flex-column t-body lh-copy c-muted-2">
      <span className="t-heading-6 c-on-base">{`${friendlyName}`}</span>
      <span>{`${address.street}${address.number ? `, ${address.number}` : ''}`}</span>
      {shippingEstimate ? (
        <FormattedMessage id="store/pickup-availability.pickup-estimate" values={{ estimate }} />
      ) : <FormattedMessage id="store/pickup-availability.pickup-unavailable" />}
    </div>
  )
}

export default StorePickupItem
