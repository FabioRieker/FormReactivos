import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToast,
  IonAlert,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { moon, sunny, downloadOutline, arrowBackOutline, swapHorizontalOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-driven',
  templateUrl: './driven.page.html',
  styleUrls: ['./driven.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonToast,
    IonAlert,
  ],
})
export class DrivenPage {
  // Modelo de datos bidireccional mediante ngModel (Template-Driven)
  public producto = {
    sku: '',
    nombre: '',
    categoria: '',
    stockMinimo: null as number | null,
    fechaNacimiento: '',
    contrasena: '',
  };

  // Signals para gestionar estado de carga, modales y modo oscuro
  public isSubmitting = signal<boolean>(false);
  public showToast = signal<boolean>(false);
  public showAlert = signal<boolean>(false);
  public isDarkMode = signal<boolean>(false);
  public alertButtons = ['Aceptar'];

  // Fecha máxima para el campo fecha de nacimiento (hoy)
  public maxDate: string = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Copia de los últimos datos enviados para la exportación a PDF
  public lastSubmittedData: any = null;

  constructor() {
    addIcons({ moon, sunny, downloadOutline, arrowBackOutline, swapHorizontalOutline });
  }

  /**
   * Conmuta el modo oscuro aplicando la clase oficial de Ionic
   */
  public toggleDarkMode(): void {
    this.isDarkMode.update((dark) => !dark);
    const active = this.isDarkMode();
    document.documentElement.classList.toggle('ion-palette-dark', active);
    document.body.classList.toggle('ion-palette-dark', active);
    document.body.classList.toggle('dark', active);
  }

  /**
   * Cifra la contraseña utilizando el estándar Web Crypto API (SHA-256)
   */
  private async cifrarContrasena(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Genera y descarga el PDF con los datos ingresados en el formulario Template-Driven
   */
  public descargarPDF(): void {
    if (!this.lastSubmittedData) {
      return;
    }

    const doc = new jsPDF();
    const data = this.lastSubmittedData;

    doc.setFillColor(45, 211, 111); // Color secundario/éxito para distinguir el comprobante
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('COMPROBANTE TEMPLATE-DRIVEN (INVENTARIO)', 14, 16);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`Fecha y hora de emisión: ${new Date().toLocaleString()}`, 14, 35);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    let y = 50;

    doc.text(`• Código SKU: ${data.sku}`, 14, y);
    y += 12;
    doc.text(`• Nombre del Producto: ${data.nombre}`, 14, y);
    y += 12;
    doc.text(`• Categoría: ${data.categoria}`, 14, y);
    y += 12;
    doc.text(`• Stock Mínimo: ${data.stockMinimo} unidades`, 14, y);
    y += 12;
    doc.text(`• Fecha de Nacimiento: ${data.fechaNacimiento}`, 14, y);
    y += 12;
    doc.text(`• Contraseña (Cifrada SHA-256):`, 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${data.contrasena}`, 14, y);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 270, 196, 270);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text('Generado mediante Formulario Template-Driven (FormsModule / ngModel).', 14, 276);

    doc.save(`driven_producto_${data.sku || 'inventario'}.pdf`);
  }

  public async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) {
      // Marcar todos los controles como touched para disparar visualmente los errores
      Object.values(form.controls).forEach((ctrl) => ctrl.markAsTouched());
      return;
    }

    this.isSubmitting.set(true);

    try {
      const contrasenaCifrada = await this.cifrarContrasena(this.producto.contrasena);

      const payloadSeguro = {
        ...this.producto,
        contrasena: contrasenaCifrada,
      };

      console.log('Payload Template-Driven enviado (contraseña cifrada):', payloadSeguro);

      this.lastSubmittedData = { ...payloadSeguro };

      // Simulación de guardado asíncrono (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      form.resetForm();
      this.showAlert.set(true);
      this.showToast.set(true);
    } catch (error) {
      console.error('Error al guardar datos del formulario template-driven', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
