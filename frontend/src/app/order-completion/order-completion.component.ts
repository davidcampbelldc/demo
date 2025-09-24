/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, type OnInit } from '@angular/core'
import { TrackOrderService } from '../Services/track-order.service'
import { ActivatedRoute, type ParamMap, RouterLink } from '@angular/router'
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatFooterCellDef, MatFooterCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFooterRowDef, MatFooterRow } from '@angular/material/table'
import { BasketService } from '../Services/basket.service'
import { AddressService } from '../Services/address.service'
import { ConfigurationService } from '../Services/configuration.service'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltip } from '@angular/material/tooltip'
import { MatIconButton } from '@angular/material/button'

import { TranslateModule } from '@ngx-translate/core'

import { MatCardModule } from '@angular/material/card'

library.add(faTwitter)

@Component({
  selector: 'app-order-completion',
  templateUrl: './order-completion.component.html',
  styleUrls: ['./order-completion.component.scss'],
  imports: [MatCardModule, TranslateModule, RouterLink, MatIconButton, MatTooltip, MatIconModule, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatFooterCellDef, MatFooterCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatFooterRowDef, MatFooterRow]
})
export class OrderCompletionComponent implements OnInit {
  public tableColumns = ['product', 'price', 'quantity', 'total price']
  public dataSource
  public orderId: string
  public orderDetails: any = { totalPrice: 0 }
  public deliveryPrice = 0
  public promotionalDiscount = 0
  public address: any
  public tweetText: string = 'I just purchased'

  constructor (private readonly configurationService: ConfigurationService, private readonly addressService: AddressService, private readonly trackOrderService: TrackOrderService, public activatedRoute: ActivatedRoute, private readonly basketService: BasketService) { }

  ngOnInit (): void {
    this.activatedRoute.paramMap.subscribe({
      next: (paramMap: ParamMap) => {
        this.orderId = paramMap.get('id')
        this.trackOrderService.find(this.orderId).subscribe({
          next: (results) => {
            // Check if results.data exists and has at least one element
            if (results?.data && results.data.length > 0 && results.data[0]) {
              const orderData = results.data[0]
              this.promotionalDiscount = orderData.promotionalAmount ? parseFloat(orderData.promotionalAmount) : 0
              this.deliveryPrice = orderData.deliveryPrice ? parseFloat(orderData.deliveryPrice) : 0
              this.orderDetails.addressId = orderData.addressId
              this.orderDetails.paymentId = orderData.paymentId
              this.orderDetails.totalPrice = orderData.totalPrice
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              this.orderDetails.itemTotal = orderData.totalPrice + this.promotionalDiscount - this.deliveryPrice
              this.orderDetails.eta = orderData.eta || '?'
              this.orderDetails.products = orderData.products || []
              this.orderDetails.bonus = orderData.bonus
              this.dataSource = new MatTableDataSource<Element>(this.orderDetails.products)
              for (const product of this.orderDetails.products) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                this.tweetText += `%0a- ${product.name}`
              }
              this.tweetText = this.truncateTweet(this.tweetText)
              this.configurationService.getApplicationConfiguration().subscribe({
                next: (config) => {
                  if (config?.application?.social) {
                    this.tweetText += '%0afrom '
                    if (config.application.social.twitterUrl) {
                      this.tweetText += config.application.social.twitterUrl.replace('https://twitter.com/', '@')
                    } else {
                      this.tweetText += config.application.name
                    }
                  }
                },
                error: (err) => { console.log(err) }
              })
              if (this.orderDetails.addressId) {
                this.addressService.getById(this.orderDetails.addressId).subscribe({
                  next: (address) => {
                    this.address = address
                  },
                  error: (error) => { console.log(error) }
                })
              }
            } else {
              // Handle case where no order data is found
              console.warn('No order data found for ID:', this.orderId)
              this.promotionalDiscount = 0
              this.deliveryPrice = 0
              this.orderDetails.addressId = null
              this.orderDetails.paymentId = null
              this.orderDetails.totalPrice = 0
              this.orderDetails.itemTotal = 0
              this.orderDetails.eta = '?'
              this.orderDetails.products = []
              this.orderDetails.bonus = 0
              this.dataSource = new MatTableDataSource<Element>([])
            }
          },
          error: (err) => { 
            console.error('Error fetching order data:', err)
            // Handle API error gracefully
            this.promotionalDiscount = 0
            this.deliveryPrice = 0
            this.orderDetails.addressId = null
            this.orderDetails.paymentId = null
            this.orderDetails.totalPrice = 0
            this.orderDetails.itemTotal = 0
            this.orderDetails.eta = '?'
            this.orderDetails.products = []
            this.orderDetails.bonus = 0
            this.dataSource = new MatTableDataSource<Element>([])
          }
        })
      },
      error: (err) => { console.log(err) }
    })
  }

  openConfirmationPDF () {
    const redirectUrl = `${this.basketService.hostServer}/ftp/order_${this.orderId}.pdf`
    window.open(redirectUrl, '_blank')
  }

  truncateTweet = (tweet: string, maxLength = 140) => {
    if (!tweet) return null
    const showDots = tweet.length > maxLength
    return `${tweet.substring(0, maxLength)}${showDots ? '...' : ''}`
  }
}
