import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
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
import { moon, sunny, downloadOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';

/**
 * Validador personalizado para Código de Barras (SKU):
 * Exactamente 12 caracteres alfanuméricos.
 */
export function skuValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const regex = /^[a-zA-Z0-9]{12}$/;
    return regex.test(control.value) ? null : { invalidSku: true };
  };
}

/**
 * Validador personalizado para Stock Mínimo:
 * Debe ser un número estrictamente mayor que 0.
 */
export function greaterThanZeroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    const val = Number(control.value);
    return !isNaN(val) && val > 0 ? null : { greaterThanZero: true };
  };
}

/**
 * Validador personalizado para Fecha de Nacimiento:
 * No puede ser superior al día de hoy (fecha futura no permitida).
 */
export function fechaNacimientoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localToday = `${year}-${month}-${day}`;

    // Comparación ISO YYYY-MM-DD
    return control.value > localToday ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
export class RegistroPage {
  // Definición del formulario reactivo fuertemente tipado
  public productoForm: FormGroup;

  // Signals para gestionar estado reactivo
  public isSubmitting = signal<boolean>(false);
  public showToast = signal<boolean>(false);
  public showAlert = signal<boolean>(false);
  public isDarkMode = signal<boolean>(false);

  public alertButtons = ['Aceptar'];

  // Fecha máxima para el picker nativo (hoy)
  public maxDate: string = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  // Almacena los últimos datos enviados para poder descargarlos en PDF
  public lastSubmittedData: any = null;

  constructor(private fb: FormBuilder) {
    // Registrar iconos de Ionicons necesarios
    addIcons({ moon, sunny, downloadOutline });

    this.productoForm = this.fb.group({
      // Código de Barras (SKU): Obligatorio, exactamente 12 caracteres alfanuméricos
      sku: ['', [Validators.required, skuValidator()]],
      // Nombre del Producto: Obligatorio
      nombre: ['', [Validators.required]],
      // Categoría: Menú desplegable con al menos 3 opciones
      categoria: ['', [Validators.required]],
      // Stock Mínimo: Obligatorio, valor numérico mayor que 0
      stockMinimo: ['', [Validators.required, greaterThanZeroValidator()]],
      // Fecha de Nacimiento: Obligatoria, no superior a hoy
      fechaNacimiento: ['', [Validators.required, fechaNacimientoValidator()]],
      // Contraseña: Obligatoria, mínimo 6 caracteres
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Getter de conveniencia para acceder a los controles en la vista
  get f() {
    return this.productoForm.controls;
  }

  // Getters para mensajes de error claros usando errorText de Ionic
  get skuError(): string {
    const control = this.productoForm.get('sku');
    if (control?.hasError('required')) {
      return 'El código SKU es obligatorio.';
    }
    if (control?.hasError('invalidSku')) {
      return 'El SKU debe tener exactamente 12 caracteres alfanuméricos.';
    }
    return '';
  }

  get nombreError(): string {
    const control = this.productoForm.get('nombre');
    if (control?.hasError('required')) {
      return 'El nombre del producto es obligatorio.';
    }
    return '';
  }

  get categoriaError(): string {
    const control = this.productoForm.get('categoria');
    if (control?.hasError('required')) {
      return 'Debe seleccionar una categoría.';
    }
    return '';
  }

  get stockMinimoError(): string {
    const control = this.productoForm.get('stockMinimo');
    if (control?.hasError('required')) {
      return 'El stock mínimo es obligatorio.';
    }
    if (control?.hasError('greaterThanZero')) {
      return 'El stock mínimo debe ser un número mayor a 0.';
    }
    return '';
  }

  get fechaNacimientoError(): string {
    const control = this.productoForm.get('fechaNacimiento');
    if (control?.hasError('required')) {
      return 'La fecha de nacimiento es obligatoria.';
    }
    if (control?.hasError('futureDate')) {
      return 'La fecha de nacimiento no puede ser superior a hoy.';
    }
    return '';
  }

  get contrasenaError(): string {
    const control = this.productoForm.get('contrasena');
    if (control?.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener mínimo 6 caracteres.';
    }
    return '';
  }

  /**
   * Conmuta el modo oscuro aplicando la clase oficial de Ionic (ion-palette-dark / dark)
   */
  public toggleDarkMode(): void {
    this.isDarkMode.update((dark) => !dark);
    const active = this.isDarkMode();
    document.documentElement.classList.toggle('ion-palette-dark', active);
    document.body.classList.toggle('dark', active);
  }

  /**
   * Cifra la contraseña utilizando el estándar Web Crypto API (SHA-256)
   * para evitar exponerla en texto plano.
   */
  private async cifrarContrasena(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Genera y descarga un documento PDF con los datos del producto registrado
   */
  public descargarPDF(): void {
    if (!this.lastSubmittedData) {
      return;
    }

    const doc = new jsPDF();
    const data = this.lastSubmittedData;

    // Encabezado con estilo
    doc.setFillColor(56, 128, 255); // Color primario Ionic
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('COMPROBANTE DE REGISTRO DE PRODUCTO', 14, 16);

    // Metadata
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`Fecha y hora de emisión: ${new Date().toLocaleString()}`, 14, 35);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    // Datos del formulario
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    let y = 50;

    doc.text(`Código de Barras (SKU): ${data.sku}`, 14, y);
    y += 12;
    doc.text(`Nombre del Producto: ${data.nombre}`, 14, y);
    y += 12;
    doc.text(`Categoría: ${data.categoria}`, 14, y);
    y += 12;
    doc.text(`Stock Mínimo: ${data.stockMinimo} unidades`, 14, y);
    y += 12;
    doc.text(`Fecha de Nacimiento: ${data.fechaNacimiento}`, 14, y);
    y += 12;
    doc.text(`Contraseña (Cifrada SHA-256):`, 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${data.contrasena}`, 14, y);

    // Pie de página
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 270, 196, 270);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text('Sistema de Gestión de Inventario Móvil - Documento generado automáticamente.', 14, 276);

    // Descarga del fichero PDF
    doc.save(`registro_producto_${data.sku || 'inventario'}.pdf`);
  }

  public async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched(); // Fuerza la visualización de errores
      return;
    }

    // Gestionar estado con Signal y desactivar el formulario
    this.isSubmitting.set(true);
    this.productoForm.disable();

    try {
      const rawData = this.productoForm.getRawValue();

      // Cifrado de la contraseña para evitar mostrarla en consola en texto plano
      const contrasenaCifrada = await this.cifrarContrasena(rawData.contrasena);

      const payloadSeguro = {
        ...rawData,
        contrasena: contrasenaCifrada, // Contraseña cifrada en hash SHA-256
      };

      console.log('Payload seguro a enviar (contraseña cifrada):', payloadSeguro);

      // Guardamos una copia para permitir la descarga en PDF
      this.lastSubmittedData = { ...payloadSeguro };

      // Simulación de petición asíncrona de guardado (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset del formulario tras el guardado
      this.productoForm.reset();
      this.productoForm.markAsPristine();
      this.productoForm.markAsUntouched();

      // Mostrar confirmación mediante alert y toast
      this.showAlert.set(true);
      this.showToast.set(true);
    } catch (error) {
      console.error('Error al persistir los datos del producto', error);
    } finally {
      this.productoForm.enable();
      this.isSubmitting.set(false);
    }
  }
}
