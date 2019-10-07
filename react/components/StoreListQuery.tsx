import React, { FC, Fragment } from 'react'
import { Query } from 'react-apollo'
import useProduct from 'vtex.product-context/useProduct'
import { useRuntime } from 'vtex.render-runtime'
import { pathOr, path } from 'ramda'
import { FormattedMessage } from 'react-intl'
import { useCssHandles } from 'vtex.css-handles'

import skuPickupSLAs from '../queries/skuPickupSLAs.gql'
import SeeAllStoresModal from './SeeAllStoresModal'
import StoreList from './StoreList'
import ItemLoader from './Loaders/ItemLoader'

const CSS_HANDLES = ['storeListEmptyMessage', 'storeList', 'storeListContainer', 'availableAtHeader'] as const

const MAX_ITEMS = 3

interface SkuPickupStoresData {
  skuPickupSLAs: SkuPickupStore[]
}

interface Variables {
  itemId: string
  seller?: string
  lat: string
  long: string
  country: string
}

const Wrapper: FC<{ handles: Record<string, string> }> = ({ children, handles }) => (
  <div className={`flex flex-column flex-grow-1 mv5 ${handles.storeListContainer}`}>
    {children}
  </div>
)

interface Props {
  coords: Coords
  selectedAddressId?: string
  onPickupChange: (pickup?: FavoritePickup) => void
  dispatch: DispatchFn
}

const StoreListQuery: FC<Props> = ({ coords, selectedAddressId, onPickupChange, dispatch }) => {
  const { selectedItem } = useProduct()
  const handles = useCssHandles(CSS_HANDLES)
  const {
    culture: { country },
  } = useRuntime()

  if (!coords.lat || !coords.long || !selectedItem) {
    return null
  }

  return (
    <Query<SkuPickupStoresData, Variables>
      query={skuPickupSLAs}
      variables={{
        itemId: selectedItem.itemId,
        seller: path(['sellers', '0', 'sellerId'], selectedItem),
        lat: coords.lat,
        long: coords.long,
        country,
      }}
      partialRefetch
      ssr={false}
    >
      {({ data, loading, error }) => {
        const hasItems = pathOr<number>(0, ['skuPickupSLAs', 'length'], data) > 0
        if (!loading && (error || !hasItems)) {
          return (
            <Wrapper handles={handles}>
              <div className={`t-body c-muted-2 ${handles.storeListEmptyMessage}`}>
                <FormattedMessage id="store/pickup-availability.empty-list" />
              </div>
            </Wrapper>
          )
        }
        if (!data) {
          return null
        }

        return (
          <Wrapper handles={handles}>
            <div className={`${handles.availableAtHeader} mb3 c-muted-2 t-body`}>
              <FormattedMessage id="store/pickup-availability.available-header" />
            </div>
            {loading ? (
              <ItemLoader />
            ) :
              (
                <Fragment>
                  <div className={handles.storeList}>
                    <StoreList
                      stores={data.skuPickupSLAs}
                      maxItems={MAX_ITEMS}
                      selectedAddressId={selectedAddressId}
                      onPickupChange={onPickupChange}
                      dispatch={dispatch}
                    />
                  </div>
                  <SeeAllStoresModal
                    stores={data.skuPickupSLAs}
                    selectedAddressId={selectedAddressId}
                    onPickupChange={onPickupChange}
                    dispatch={dispatch}
                    minimumItems={MAX_ITEMS}
                  />
                </Fragment>
              )
            }

          </Wrapper>
        )
      }}
    </Query>
  )
}

export default StoreListQuery