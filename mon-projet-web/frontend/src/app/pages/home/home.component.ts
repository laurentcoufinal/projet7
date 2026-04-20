import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/api.service';
import { Car, FaqEntry } from '../../shared/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  cars: Car[] = [];
  faq: FaqEntry[] = [];
  loading = true;

  constructor(private readonly apiService: ApiService) {}

  async ngOnInit() {
    try {
      const [carsResponse, faqResponse] = await Promise.all([
        this.apiService.getCars(),
        this.apiService.getFaq()
      ]);
      this.cars = carsResponse.items;
      this.faq = faqResponse.items;
    } finally {
      this.loading = false;
    }
  }
}
