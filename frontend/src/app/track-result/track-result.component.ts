/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { ActivatedRoute } from '@angular/router'
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table'
import { Component, type OnInit } from '@angular/core'
import { TrackOrderService } from '../Services/track-order.service'
import { DomSanitizer } from '@angular/platform-browser'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHome, faSync, faTruck, faTruckLoading, faWarehouse } from '@fortawesome/free-solid-svg-icons'

import { TranslateModule } from '@ngx-translate/core'
import { MatCardModule } from '@angular/material/card'

library.add(faWarehouse, faSync, faTruckLoading, faTruck, faHome)

export enum Status {
  New,
  Packing,
  Transit,
  Delivered
}

@Component({
  selector: 'app-track-result',
  templateUrl: './track-result.component.html',
  styleUrls: ['./track-result.component.scss'],
  imports: [MatCardModule, TranslateModule, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow]
})
export class TrackResultComponent implements OnInit {
  public displayedColumns = ['product', 'price', 'quantity', 'total price']
  public dataSource = new MatTableDataSource()
  public orderId?: string
  public results: any = {}
  public status: Status = Status.New
  public Status = Status
  constructor (private readonly route: ActivatedRoute, private readonly trackOrderService: TrackOrderService, private readonly sanitizer: DomSanitizer) {}

  ngOnInit (): void {
    this.orderId = this.route.snapshot.queryParams.id
    this.trackOrderService.find(this.orderId).subscribe({
      next: (results) => {
        // Check if results.data exists and has at least one element
        if (results?.data && results.data.length > 0 && results.data[0]) {
          const orderData = results.data[0]
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          this.results.orderNo = this.sanitizer.bypassSecurityTrustHtml(`<code>${orderData.orderId}</code>`)
          this.results.email = orderData.email
          this.results.totalPrice = orderData.totalPrice
          this.results.products = orderData.products || []
          this.results.eta = orderData.eta !== undefined ? orderData.eta : '?'
          this.results.bonus = orderData.bonus
          this.dataSource.data = this.results.products
          if (orderData.delivered) {
            this.status = Status.Delivered
          } else if (this.route.snapshot.data.type) {
            this.status = Status.New
          } else if (this.results.eta > 2) {
            this.status = Status.Packing
          } else {
            this.status = Status.Transit
          }
        } else {
          // Handle case where no order data is found
          console.warn('No order data found for ID:', this.orderId)
          this.results.orderNo = this.sanitizer.bypassSecurityTrustHtml(`<code>${this.orderId}</code>`)
          this.results.email = 'N/A'
          this.results.totalPrice = 0
          this.results.products = []
          this.results.eta = '?'
          this.results.bonus = 0
          this.dataSource.data = []
          this.status = Status.New
        }
      },
      error: (error) => {
        console.error('Error fetching order data:', error)
        // Handle API error gracefully
        this.results.orderNo = this.sanitizer.bypassSecurityTrustHtml(`<code>${this.orderId}</code>`)
        this.results.email = 'Error loading data'
        this.results.totalPrice = 0
        this.results.products = []
        this.results.eta = '?'
        this.results.bonus = 0
        this.dataSource.data = []
        this.status = Status.New
      }
    })
  }
}
