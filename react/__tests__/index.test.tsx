import React from 'react'
import { render, flushPromises } from '@vtex/test-tools/react'
import Index from '../index'

import { getProduct } from '../__mocks__/productMock'

import ProductContextProvider from '../__mocks__/vtex.product-context/ProductContextProvider'

import logisticsQuery from '../queries/logistics.gql'
import sessionQuery from '../queries/sessionQuery.gql'
import skuPickupSLA from '../queries/skuPickupSLA.gql'

const renderComponent = (customProps: any = {}) => {


  const sessionMock = customProps.sessionMock || {
    request: {
      query: sessionQuery,
    },
    result: {
      loading: false,
      data: {
        getSession: {},
      }
    }
  }

  const logisticsMock = {
    request: {
      query: logisticsQuery,
    },
    result: {
      loading: false,
      data: {
        logistics: {
          googleMapsKey: 'aaaaa',
        }
      }
    }
  }
  const product = customProps.product || getProduct()
  const skuSelector = customProps.skuSelector || { isVisible: false }

  const moreMock = customProps.otherMocks || []

  return render(<ProductContextProvider product={product} skuSelector={skuSelector}>
    <Index />
  </ProductContextProvider>, {
    graphql: { mocks: [logisticsMock, sessionMock, ...moreMock] }
  })
}

test('should render choose store view when no favorite pickup in session', async () => {
  jest.useFakeTimers()



  const { getByText } = renderComponent()

  await flushPromises()
  jest.runAllTimers()

  expect(getByText(/Choose store/)).toBeDefined()
  expect(getByText(/This product is available for pickup/)).toBeDefined()
})

test('should render select sku message if sku selector is invalid state', async () => {
  jest.useFakeTimers()

  const { getByText } = renderComponent({
    skuSelector: { isVisible: true, areAllVariationsSelected: false }
  })

  await flushPromises()
  jest.runAllTimers()

  expect(getByText(/Select SKUs above to check availability for pickup/)).toBeDefined()
})

test('should render properly if sku selector is visible and valid', async () => {
  jest.useFakeTimers()

  const { getByText } = renderComponent({
    skuSelector: { isVisible: true, areAllVariationsSelected: true }
  })

  await flushPromises()
  jest.runAllTimers()

  expect(getByText(/Choose store/)).toBeDefined()
  expect(getByText(/This product is available for pickup/)).toBeDefined()
})

test('should render store selected component with shipping estimate properly', async () => {
  jest.useFakeTimers()

  const sessionMock = {
    request: {
      query: sessionQuery,
    },
    result: {
      loading: false,
      data: {
        getSession: {
          cacheId: 'a',
          favoritePickup: {
            cacheId: 'ppbotafogo',
            name: 'Pickup Botafogo',
            address: {
              street: 'Praia de Botafogo',
              number: '300',
              addressId: 'ppbotafogo',
              state: 'RJ',
              country: 'BRA',
              geoCoordinates: [-43, -20],
              postalCode: '2250040',
              complement: '',
              neighborhood: 'Botafogo'
            }
          }
        },
      }
    }
  }

  const skuPickupMock = {
    request: {
      query: skuPickupSLA,
      variables: {
        itemId: '1',
        seller: '1',
        lat: '-20',
        long: '-43',
        country: 'BRA',
        pickupId: 'ppbotafogo'
      }
    },
    result: {
      loading: false,
      data: {
        skuPickupSLA: {
          id: 'ppbotafogo',
          shippingEstimate: '30m',
          pickupStoreInfo: {
            friendlyName: 'Pickup Botafogo',
            address: {
              cacheId: 'a',
              street: 'Praia de Botafogo',
              number: '300',
              addressId: 'ppbotafogo',
              state: 'RJ',
              country: 'BRA',
              geoCoordinates: [-43, -20],
              postalCode: '2250040',
              complement: '',
              neighborhood: 'Botafogo',
              city: 'Rio de Janeiro'
            }
          }
        },
      }
    }
  }

  const otherMocks = [skuPickupMock]

  const { getByText } = renderComponent({
    sessionMock,
    otherMocks,
  })

  await flushPromises()

  jest.runAllTimers()

  expect(getByText(new RegExp(skuPickupMock.result.data.skuPickupSLA.pickupStoreInfo.friendlyName))).toBeDefined()
  expect(getByText(new RegExp(skuPickupMock.result.data.skuPickupSLA.pickupStoreInfo.address.street))).toBeDefined()
  expect(getByText(new RegExp(skuPickupMock.result.data.skuPickupSLA.pickupStoreInfo.address.number))).toBeDefined()
  expect(getByText(new RegExp(`shipping estimate: ${skuPickupMock.result.data.skuPickupSLA.shippingEstimate}, isPickup: true`))).toBeDefined()
  expect(getByText(/Choose a different store/)).toBeDefined()
})