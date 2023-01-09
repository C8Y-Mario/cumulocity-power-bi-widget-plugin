/**
 * Copyright (c) 2021 Software AG, Darmstadt, Germany and/or its licensors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Injectable } from '@angular/core';
import { FetchClient, IFetchResponse } from '@c8y/client';
@Injectable({providedIn:'root'})
export class HttpService {
    public path: string = null;
    constructor(private fetchClient: FetchClient) {
        this.path = '';
    }
    async Get<T>(endPoint: string, params?: object, headers = { accept: 'application/json' }): Promise<IFetchResponse> {
        const method = 'GET';
        const options = {method, headers, params};
        return this.fetchClient.fetch(this.getEndPoint(endPoint), options);
    }
    async Head<T>(endPoint: string, params?: object, headers = { accept: 'application/json' }): Promise<IFetchResponse> {
        const method = 'HEAD';
        const options = {method, headers, params};
        return this.fetchClient.fetch(this.getEndPoint(endPoint), options);
    }
    async Post<T>(endPoint: string,
                  body: object, params?: object,
                  headers = { accept: 'application/json' }): Promise<IFetchResponse> {
        return this.fetchClient.fetch(this.getEndPoint(endPoint), {
            method: 'POST',
            body: JSON.stringify(body),
            headers,
            params
        });
    }
    async Delete<T>(endPoint: string,
                    params?: object,
                    headers = { accept: 'application/json' }): Promise<IFetchResponse> {
        const method = 'DELETE';
        const options = {method, headers, params};
        return this.fetchClient.fetch(this.getEndPoint(endPoint), options);
    }
    private getEndPoint(endPoint: string): string {
        return this.path + endPoint;
    }
}
